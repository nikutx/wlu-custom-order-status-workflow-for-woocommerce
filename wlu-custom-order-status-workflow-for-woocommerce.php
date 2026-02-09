<?php
/**
 * Plugin Name: Custom Order Statuses for WooCommerce
 * Description: Create custom WooCommerce order statuses and manage them via a React admin UI.
 * Version: 0.1.0
 * Author: Web Level Up
 * Requires PHP: 8.0
 * Text Domain: wlu-order-workflow
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