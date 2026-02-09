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
        // Get existing options or defaults
        $defaults = [
            'cleanOnUninstall' => false,
            'disableNativeEmails' => false,
            'enableAdminColors' => true,
            'enableFrontendColors' => true,
            'licenseKey' => ''
        ];
        $stored = get_option('wlu_ow_options', []);

        // Merge stored with defaults to ensure all keys exist
        $settings = wp_parse_args(is_array($stored) ? $stored : [], $defaults);

        // Type casting for React
        $settings['cleanOnUninstall'] = (bool) $settings['cleanOnUninstall'];
        $settings['disableNativeEmails'] = (bool) $settings['disableNativeEmails'];
        $settings['enableAdminColors'] = (bool) $settings['enableAdminColors'];

        return new WP_REST_Response($settings, 200);
    }

    public static function save_settings(WP_REST_Request $request) {
        $data = $request->get_json_params();

        // Fetch existing to merge properly if needed, though usually frontend sends full object
        $current = get_option('wlu_ow_options', []);

        // Sanitize and Build
      $clean = [
          'cleanOnUninstall' => !empty($data['cleanOnUninstall']),
          'disableNativeEmails' => !empty($data['disableNativeEmails']),
          'enableAdminColors' => isset($data['enableAdminColors']) ? (bool)$data['enableAdminColors'] : true,
          'enableFrontendColors' => isset($data['enableFrontendColors']) ? (bool)$data['enableFrontendColors'] : true,
          'licenseKey' => sanitize_text_field($data['licenseKey'] ?? ($current['licenseKey'] ?? ''))
      ];

        update_option('wlu_ow_options', $clean);

        return new WP_REST_Response($clean, 200);
    }

    public static function check_permission() {
        return current_user_can('manage_woocommerce');
    }
}