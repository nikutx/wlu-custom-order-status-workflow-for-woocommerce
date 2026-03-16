<?php
namespace WEBLEVELUP_STATUS\Rest;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

if (!defined('ABSPATH')) exit;

class SettingsController {

    public static function register_routes() {
        register_rest_route('weblevelup-status/v1', '/settings', [
            [
                'methods' => 'GET',
                'callback' => [__CLASS__, 'get_settings'],
                'permission_callback' => [__CLASS__, 'check_permission']
            ],
            [
                'methods' => 'POST',
                'callback' => [__CLASS__, 'save_settings'],
                'permission_callback' => [__CLASS__, 'check_permission']
            ]
        ]);

        // Safely stubbed License Verification Route
        register_rest_route('weblevelup-status/v1', '/settings/license', [
            'methods' => 'POST',
            'callback' => [__CLASS__, 'verify_license'],
            'permission_callback' => [__CLASS__, 'check_permission']
        ]);

        // 🚨 FALLBACK ENDPOINT FOR REACT FRONTEND 🚨
        // Prevents 404 errors when Pro is not active by returning an empty rules array
        if (!apply_filters('weblevelup_status_workflow_pro_is_active', false)) {
            register_rest_route('weblevelup-status/v1', '/rules', [
                'methods' => 'GET',
                'callback' => function() { return new \WP_REST_Response([], 200); },
                'permission_callback' => [__CLASS__, 'check_permission']
            ]);
        }
    }

    public static function get_settings() {
        $pro_plugin_path = 'wlu-workflow-pro/wlu-workflow-pro.php';
        $pro_plugin_full_path = wp_normalize_path(WP_PLUGIN_DIR . '/' . $pro_plugin_path);

        $active_plugins = (array) get_option('active_plugins', []);
        $is_active = in_array($pro_plugin_path, $active_plugins);

        if (is_multisite()) {
            $network_active = (array) get_site_option('active_sitewide_plugins', []);
            if (array_key_exists($pro_plugin_path, $network_active)) {
                $is_active = true;
            }
        }

        $stored = get_option('weblevelup_status_options', []);
        if (!is_array($stored)) {
            $stored = [];
        }

        $settings = [
            'cleanOnUninstall'     => (bool) ($stored['cleanOnUninstall'] ?? false),
            'disableNativeEmails'  => (bool) ($stored['disableNativeEmails'] ?? false),
            'enableAdminColors'    => (bool) ($stored['enableAdminColors'] ?? true),
            'enableFrontendColors' => (bool) ($stored['enableFrontendColors'] ?? true),

            'licenseKey'           => get_option('weblevelup_status_license_key', ''),
            'licenseStatus'        => get_option('weblevelup_status_license_status', 'inactive'),

            'proInstalled'         => file_exists($pro_plugin_full_path),
            'proActive'            => $is_active
        ];

        return new WP_REST_Response($settings, 200);
    }

    public static function save_settings(WP_REST_Request $request) {
        $data = $request->get_json_params();

        $clean = [
            'cleanOnUninstall' => !empty($data['cleanOnUninstall']),
            'disableNativeEmails' => !empty($data['disableNativeEmails']),
            'enableAdminColors' => isset($data['enableAdminColors']) ? (bool)$data['enableAdminColors'] : true,
            'enableFrontendColors' => isset($data['enableFrontendColors']) ? (bool)$data['enableFrontendColors'] : true,
        ];

        update_option('weblevelup_status_options', $clean);

        return new WP_REST_Response($clean, 200);
    }

    /**
     * Safely handles the license key and validates via SDK against the dynamic HUB URL
     */
    public static function verify_license(WP_REST_Request $request) {
        $data = $request->get_json_params();
        $action = sanitize_text_field($data['action'] ?? 'verify');
        // Kept the trim() just in case of accidental spaces when pasting!
        $provided_key = trim(sanitize_text_field($data['license_key'] ?? ''));

        if ($action === 'disconnect') {
            delete_option('weblevelup_status_license_key');
            delete_option('weblevelup_status_license_status');
            return new WP_REST_Response(['success' => true, 'message' => 'License disconnected.'], 200);
        }

        if (empty($provided_key)) {
            return new WP_REST_Response(['success' => false, 'message' => 'No valid license key found.'], 400);
        }

        // --- DYNAMIC NETWORK TEST (Local-to-Local OR Prod-to-Prod) ---
        if (class_exists('\WEBLEVELUP_SDK\Licensing\LicenseClient')) {
            // This will use http://wlu-commerce.local during development!
            $client = new \WEBLEVELUP_SDK\Licensing\LicenseClient(WEBLEVELUP_STATUS_HUB_URL);
            $response = $client->activate_license($provided_key, 'wlu-workflow-pro');

            // If the server rejects the key, throw the real error back to React
            if (is_wp_error($response)) {
                return new WP_REST_Response([
                    'success' => false,
                    'message' => $response->get_error_message()
                ], 400);
            }
        }

        // --- SUCCESS! SAVE THE KEY AND STATUS ---
        update_option('weblevelup_status_license_key', $provided_key);
        update_option('weblevelup_status_license_status', 'active');

        return new WP_REST_Response([
            'success' => true,
            'message' => 'License activated successfully!'
        ], 200);
    }

    public static function check_permission() {
        return current_user_can('manage_woocommerce');
    }
}