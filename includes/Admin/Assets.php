<?php
namespace WEBLEVELUP_STATUS\Admin;

if (!defined('ABSPATH')) exit;

class Assets {
    public function enqueue() {
        $screen = get_current_screen();

        if (!$screen || strpos($screen->id, 'wlu-custom-order-status') === false) {
            return;
        }

        $version = '1.0.10';

        // FIXED: Bulletproof path math to get the exact plugin root URL and Path
        $root_dir = dirname(__FILE__, 3);
        $url = plugin_dir_url($root_dir . '/wlu-custom-order-status-workflow.php');

        // --- SMART DEV/PROD DETECTION ---
        $is_local_env = strpos(site_url(), 'dev01.local') !== false;

        // Only run Vite if we are local AND the dev file exists
        if ($is_local_env && file_exists(__DIR__ . '/AssetsDev.php')) {
            require_once __DIR__ . '/AssetsDev.php';
            \WEBLEVELUP_STATUS\Admin\AssetsDev::enqueue_vite_dev_scripts();
        } else {
            // Production Fallback: Load the compiled files safely
            $js_url = $url . 'dist/main.js';
            wp_enqueue_script('weblevelup-status-app', $js_url, ['wp-element', 'wp-i18n'], $version, true);

            // Only enqueue CSS if Vite actually generated a file
            $css_path = $root_dir . '/dist/main.css';
            $css_url = $url . 'dist/main.css';

            if (file_exists($css_path)) {
                wp_enqueue_style('weblevelup-status-app', $css_url, [], $version);
            }
        }

        // Full screen CSS fixes
        $css = "
            #wpbody-content > .wrap > h1 { display: none !important; }
            .wp-header-end { display: none !important; }
            #wpbody-content > .wrap { margin-top: 0 !important; padding-top: 10px !important; }
            #wpfooter { display: none !important; }
        ";
        wp_add_inline_style('common', $css);

        // --- SAFE CONFIGURATION ---
        $config = [
            'restUrl'       => rest_url('weblevelup-status/v1/'),
            'nonce'         => wp_create_nonce('wp_rest'),
            'adminEmail'    => get_option('admin_email'),
            'version'       => $version,
            'proTabs'       => apply_filters('weblevelup_status_pro_tabs', []),
            'proUsageStats' => apply_filters('weblevelup_status_localized_usage_stats', [])
        ];

        // Safely pass JS variables
        wp_register_script('weblevelup-status-global-config', false);
        wp_enqueue_script('weblevelup-status-global-config');
        wp_localize_script('weblevelup-status-global-config', 'WEBLEVELUP_STATUS', $config);
    }
}