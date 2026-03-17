<?php
namespace WEBLEVELUP_STATUS\Rest;

use WP_REST_Request;
use WP_REST_Response;

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

        // 🚨 License Endpoint completely removed!
        // 🚨 Fallback Rules Endpoint completely removed!
    }

    public static function get_settings() {
        $stored = get_option('weblevelup_status_options', []);
        if (!is_array($stored)) {
            $stored = [];
        }

        $settings = [
            'cleanOnUninstall'     => (bool) ($stored['cleanOnUninstall'] ?? false),
            'disableNativeEmails'  => (bool) ($stored['disableNativeEmails'] ?? false),
            'enableAdminColors'    => (bool) ($stored['enableAdminColors'] ?? true),
            'enableFrontendColors' => (bool) ($stored['enableFrontendColors'] ?? true)
        ];

        return new WP_REST_Response($settings, 200);
    }

    public static function save_settings(WP_REST_Request $request) {
        $data = $request->get_json_params();

        $clean = [
            'cleanOnUninstall'     => !empty($data['cleanOnUninstall']),
            'disableNativeEmails'  => !empty($data['disableNativeEmails']),
            'enableAdminColors'    => isset($data['enableAdminColors']) ? (bool)$data['enableAdminColors'] : true,
            'enableFrontendColors' => isset($data['enableFrontendColors']) ? (bool)$data['enableFrontendColors'] : true,
        ];

        update_option('weblevelup_status_options', $clean);

        return new WP_REST_Response($clean, 200);
    }

    public static function check_permission() {
        return current_user_can('manage_woocommerce');
    }
}