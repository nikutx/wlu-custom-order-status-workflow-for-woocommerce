<?php
namespace WLU_OW\Rest;

use WP_REST_Request;
use WP_REST_Response;

if (!defined('ABSPATH')) exit;

class SettingsController {

    public static function register_routes() {
        register_rest_route('wlu-ow/v1', '/settings', [
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
    }

    public static function get_settings() {
        // Get options or defaults
        $settings = get_option('wlu_ow_options', [
            'cleanOnUninstall' => false,
            'disableNativeEmails' => false,
            'licenseKey' => ''
        ]);

        // Ensure booleans are real booleans for React
        $settings['cleanOnUninstall'] = (bool) ($settings['cleanOnUninstall'] ?? false);
        $settings['disableNativeEmails'] = (bool) ($settings['disableNativeEmails'] ?? false);

        return new WP_REST_Response($settings, 200);
    }

    public static function save_settings(WP_REST_Request $request) {
        $data = $request->get_json_params();

        $clean = [
            'cleanOnUninstall' => !empty($data['cleanOnUninstall']),
            'disableNativeEmails' => !empty($data['disableNativeEmails']),
            'licenseKey' => sanitize_text_field($data['licenseKey'] ?? '')
        ];

        update_option('wlu_ow_options', $clean);

        return new WP_REST_Response($clean, 200);
    }

    public static function check_permission() {
        return current_user_can('manage_woocommerce');
    }
}