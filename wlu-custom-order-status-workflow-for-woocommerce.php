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

WLU_OW\Plugin::init();
