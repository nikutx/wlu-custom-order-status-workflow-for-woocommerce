<?php
namespace WLU_OW;

if (!defined('ABSPATH')) exit;

// 1. Load dependencies
require_once WLU_OW_PATH . 'includes/Admin/Menu.php';
require_once WLU_OW_PATH . 'includes/Admin/Assets.php';
require_once WLU_OW_PATH . 'includes/Domain/StatusesStore.php';
require_once WLU_OW_PATH . 'includes/Woo/StatusesRegistrar.php';
require_once WLU_OW_PATH . 'includes/Rest/Routes.php';
require_once WLU_OW_PATH . 'includes/Woo/WorkflowEngine.php';
require_once WLU_OW_PATH . 'includes/Admin/StatusColorInjector.php';
require_once WLU_OW_PATH . 'includes/Frontend/CustomerStatusDisplay.php';
// Load the new Seeder
require_once WLU_OW_PATH . 'includes/Infrastructure/DefaultStatusSeeder.php';

use WLU_OW\Admin\Menu;
use WLU_OW\Admin\Assets;
use WLU_OW\Domain\StatusesStore;
use WLU_OW\Woo\StatusesRegistrar;
use WLU_OW\Rest\Routes;
use WLU_OW\Woo\WorkflowEngine;
use WLU_OW\Admin\StatusColorInjector;
use WLU_OW\Frontend\CustomerStatusDisplay;
use WLU_OW\Infrastructure\DefaultStatusSeeder;

final class Plugin {
  public const SLUG = 'wlu-custom-order-status-workflow';
  public const REST_NS = 'wlu-ow/v1';


  public const DB_VERSION = '1.0.1';

  public static function init(): void {

    // 1. Initialize Store FIRST
    $store = new StatusesStore();

    // 2. SELF-HEALING & SEEDING CHECK
    // If DB version mismatch, run installer AND seeder
    if (get_option('wlu_ow_db_version') !== self::DB_VERSION) {

         // Run standard table installer (if you have one)
         if (file_exists(WLU_OW_PATH . 'includes/Infrastructure/Installer.php')) {
             require_once WLU_OW_PATH . 'includes/Infrastructure/Installer.php';
             \WLU_OW\Infrastructure\Installer::install();
         }

         // Run the Seeder to populate default colors safely
         DefaultStatusSeeder::seed($store);

         // Update version so this doesn't run on every single page load
         update_option('wlu_ow_db_version', self::DB_VERSION);
    }
    // ---------------------------------------

    // 3. Initialize Admin UI (Colors)
    (new StatusColorInjector($store))->init();

    // 4. Initialize Frontend UI (Colors)
    (new CustomerStatusDisplay($store))->init();

    $menu   = new Menu();
    $assets = new Assets();
    $woo    = new StatusesRegistrar($store);
    $rest   = new Routes($store);

    add_action('admin_menu', [$menu, 'register_menu']);
    add_action('admin_enqueue_scripts', [$assets, 'enqueue']);

    add_action('init', [$woo, 'register_post_statuses'], 9);
    add_filter('wc_order_statuses', [$woo, 'filter_wc_order_statuses']);

    add_action('rest_api_init', [$rest, 'register']);

    // Start the Automation Engine
    WorkflowEngine::init();
  }
}