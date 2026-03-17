<?php
namespace WEBLEVELUP_STATUS\Admin;

if (!defined('ABSPATH')) exit;

class Assets {
    public function enqueue() {
        $screen = get_current_screen();

        if (!$screen || strpos($screen->id, 'wlu-custom-order-status') === false) {
            return;
        }

        $version = '1.0.2';
        $url = plugin_dir_url(dirname(__FILE__, 2));

        // --- SMART DEV/PROD DETECTION ---
        // Since our zip packager deletes AssetsDev.php, if it exists, we are definitely local!
        if (file_exists(__DIR__ . '/AssetsDev.php')) {
            require_once __DIR__ . '/AssetsDev.php';
            \WEBLEVELUP_STATUS\Admin\AssetsDev::enqueue_vite_dev_scripts();
        } else {
            // Production Fallback: Load the compiled files
            $js_url = $url . 'dist/main.js';
            $css_url = $url . 'dist/main.css';
            wp_enqueue_script('weblevelup-status-app', $js_url, ['wp-element', 'wp-i18n'], $version, true);
            wp_enqueue_style('weblevelup-status-app', $css_url, [], $version);
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
        // We use apply_filters() so the Pro plugin can securely inject its navigation tabs!
       $config = [
                   'restUrl'       => rest_url('weblevelup-status/v1/'),
                   'nonce'         => wp_create_nonce('wp_rest'),
                   'adminEmail'    => get_option('admin_email'),

                   // 🚨 CHANGED: Using the full prefix here!
                   'proTabs'       => apply_filters('weblevelup_status_pro_tabs', []),

                   // 🚨 CHANGED: Using the full prefix here!
                   'proUsageStats' => apply_filters('weblevelup_status_localized_usage_stats', [])
               ];

        // Safely pass JS variables
        wp_register_script('weblevelup-status-global-config', false);
        wp_enqueue_script('weblevelup-status-global-config');
        wp_localize_script('weblevelup-status-global-config', 'WEBLEVELUP_STATUS', $config);
    }
}