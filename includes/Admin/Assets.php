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

       // --- STRICT LICENSE CHECK ---
               $active_plugins = (array) get_option('active_plugins', []);
               $is_pro_plugin_active = false;

               // Scan the database's active plugins list for the Pro plugin
               foreach ($active_plugins as $plugin) {
                   if (strpos($plugin, 'wlu-workflow-pro') !== false) {
                       $is_pro_plugin_active = true;
                       break;
                   }
               }

               $has_license_key = !empty(get_option('weblevelup_status_license_key'));

               $is_pro = ($is_pro_plugin_active && $has_license_key) ? '1' : '0';

               // Safely pass JS variables
               wp_register_script('weblevelup-status-global-config', false);
               wp_enqueue_script('weblevelup-status-global-config');
               wp_localize_script('weblevelup-status-global-config', 'WEBLEVELUP_STATUS', [
                   'restUrl'        => rest_url('weblevelup-status/v1/'),
                   'nonce'          => wp_create_nonce('wp_rest'),
                   'adminEmail'     => get_option('admin_email'),
                   'isPro'          => $is_pro,
                   'isProInstalled' => $is_pro_plugin_active ? '1' : '0',
                   'upgradeUrl'     => 'https://weblevelup.co.uk/plugins/custom-order-status-workflow-for-woocommerce/'
               ]);
    }
}