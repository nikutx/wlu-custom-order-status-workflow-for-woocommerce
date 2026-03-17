<?php
/**
 * Plugin Name:       WLU Custom Order Status for WooCommerce
 * Plugin URI:        https://weblevelup.co.uk/plugins/custom-order-status-workflow-for-woocommerce/
 * Description:       Create custom WooCommerce order statuses, add beautiful status colors to your dashboard, and organize your store's fulfillment process.
 * Version:           1.0.2
 * Author:            Web Level Up
 * Author URI:        https://weblevelup.co.uk
 * Text Domain:       wlu-custom-order-status-workflow
 * Requires at least: 6.0
 * Tested up to:      6.9
 * WC requires at least: 8.0
 * WC tested up to:   10.5
 * Requires PHP:      7.4
 * License:           GPLv2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 */

if (!defined('ABSPATH')) exit;

// 1. LOAD COMPOSER AUTOLOADER FIRST!
if (file_exists(__DIR__ . '/vendor/autoload.php')) {
    require_once __DIR__ . '/vendor/autoload.php';
}

define('WEBLEVELUP_STATUS_VERSION', '1.0.2');
define('WEBLEVELUP_STATUS_FILE', __FILE__);
define('WEBLEVELUP_STATUS_PATH', plugin_dir_path(__FILE__));
define('WEBLEVELUP_STATUS_URL', plugin_dir_url(__FILE__));

require_once WEBLEVELUP_STATUS_PATH . 'includes/Plugin.php';

// --- 1. ACTIVATION HOOK ---
register_activation_hook(__FILE__, function () {
    // Only run the database installer if WooCommerce is actually active
    if (class_exists('WooCommerce')) {
        \WEBLEVELUP_STATUS\Plugin::init();

        if (file_exists(WEBLEVELUP_STATUS_PATH . 'includes/Infrastructure/Installer.php')) {
            require_once WEBLEVELUP_STATUS_PATH . 'includes/Infrastructure/Installer.php';
            \WEBLEVELUP_STATUS\Infrastructure\Installer::install();
        }
        flush_rewrite_rules();
    }
});

// --- 2. INITIALIZATION GATEKEEPER ---
add_action('plugins_loaded', function() {
    // If WooCommerce isn't found, do nothing (and show a beautiful red notice)
    if (!class_exists('WooCommerce')) {
        add_action('admin_notices', function() {
            echo '<div class="notice notice-error is-dismissible"><p><strong>WLU Custom Order Status</strong> requires WooCommerce to be installed and active. Please activate WooCommerce to use this plugin.</p></div>';
        });
        return;
    }

    // WooCommerce is present. Launch!
    \WEBLEVELUP_STATUS\Plugin::init();
});

// --- ADD SETTINGS LINK TO PLUGIN LIST ---
add_filter('plugin_action_links_' . plugin_basename(__FILE__), function($links) {
    $settings_link = '<a href="' . admin_url('admin.php?page=wlu-custom-order-status-workflow#/settings') . '">Settings</a>';
    $pro_link = '<a href="https://weblevelup.co.uk/plugins/custom-order-status-woocommerce" target="_blank" style="color:#2271b1;font-weight:bold;">Go Pro</a>';

    array_unshift($links, $settings_link);
    $links[] = $pro_link;

    return $links;
});

// Declare High-Performance Order Storage (HPOS) Compatibility
add_action('before_woocommerce_init', function() {
    if (class_exists(\Automattic\WooCommerce\Utilities\FeaturesUtil::class)) {
        \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility('custom_order_tables', __FILE__, true);
    }
});