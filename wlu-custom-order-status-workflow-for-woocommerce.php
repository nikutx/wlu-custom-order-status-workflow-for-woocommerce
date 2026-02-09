<?php
/**
 * Plugin Name:       Custom Order Status & Workflow Automation for WooCommerce
 * Plugin URI:        https://weblevelup.co.uk/plugins/custom-order-status-workflow/
 * Author URI:        https://weblevelup.co.uk
 * Description:       Create custom order statuses, automate email notifications, and streamline your fulfillment workflow.
 * Version:           1.0.1
 * Author:            Web Level Up

 * Text Domain:       wlu-custom-order-status-workflow  <-- UPDATED
 * Domain Path:       /languages
 * Requires at least: 6.2
 * Requires PHP:      7.4
 * WC requires at least: 8.0
 * License:           GPLv2 or later
 */
if (!defined('ABSPATH')) exit;

define('WLU_OW_VERSION', '0.1.0');
define('WLU_OW_FILE', __FILE__);
define('WLU_OW_PATH', plugin_dir_path(__FILE__));
define('WLU_OW_URL', plugin_dir_url(__FILE__));

require_once WLU_OW_PATH . 'includes/Plugin.php';

// --- 1. ACTIVATION HOOK ---
register_activation_hook(__FILE__, function () {
    // Check if WooCommerce is active
    if (!is_plugin_active('woocommerce/woocommerce.php') && !class_exists('WooCommerce')) {
        deactivate_plugins(plugin_basename(__FILE__));
        wp_die('This plugin requires WooCommerce to be installed and active.');
    }

    \WLU_OW\Plugin::init();
    require_once WLU_OW_PATH . 'includes/Infrastructure/Installer.php';
    \WLU_OW\Infrastructure\Installer::install();
    flush_rewrite_rules();
});

// --- 2. INITIALIZATION GATEKEEPER ---
add_action('plugins_loaded', function() {
    // If WooCommerce isn't found, do nothing (and show a notice)
    if (!class_exists('WooCommerce')) {
        add_action('admin_notices', function() {
            echo '<div class="error"><p><strong>WLU Custom Status and Order Workflow</strong> requires WooCommerce to be installed and active.</p></div>';
        });
        return;
    }

    // WooCommerce is present. Launch!
    \WLU_OW\Plugin::init();
});

// --- ADD SETTINGS LINK TO PLUGIN LIST ---
add_filter('plugin_action_links_' . plugin_basename(__FILE__), function($links) {
    // 1. Settings Link
    $settings_link = '<a href="' . admin_url('admin.php?page=wlu-order-workflow&tab=settings') . '">Settings</a>';

    // 2. Premium Link (Highlighted)
    $pro_link = '<a href="https://weblevelup.co.uk/plugins/wlu-order-workflow" target="_blank" style="color:#2271b1;font-weight:bold;">Go Pro</a>';

    // Add to beginning of array
    array_unshift($links, $settings_link);
    $links[] = $pro_link; // Add Pro link at the end

    return $links;
});