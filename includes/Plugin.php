<?php
namespace WEBLEVELUP_STATUS;

if (!defined('ABSPATH')) exit;

// 1. Load dependencies
require_once WEBLEVELUP_STATUS_PATH . 'includes/Admin/Menu.php';
require_once WEBLEVELUP_STATUS_PATH . 'includes/Admin/Assets.php';
require_once WEBLEVELUP_STATUS_PATH . 'includes/Domain/StatusesStore.php';
require_once WEBLEVELUP_STATUS_PATH . 'includes/Woo/StatusesRegistrar.php';
require_once WEBLEVELUP_STATUS_PATH . 'includes/Rest/Routes.php';
require_once WEBLEVELUP_STATUS_PATH . 'includes/Admin/StatusColorInjector.php';
require_once WEBLEVELUP_STATUS_PATH . 'includes/Frontend/CustomerStatusDisplay.php';
// Load the new Seeder
require_once WEBLEVELUP_STATUS_PATH . 'includes/Infrastructure/DefaultStatusSeeder.php';

use WEBLEVELUP_STATUS\Admin\Menu;
use WEBLEVELUP_STATUS\Admin\Assets;
use WEBLEVELUP_STATUS\Domain\StatusesStore;
use WEBLEVELUP_STATUS\Woo\StatusesRegistrar;
use WEBLEVELUP_STATUS\Rest\Routes;
use WEBLEVELUP_STATUS\Admin\StatusColorInjector;
use WEBLEVELUP_STATUS\Frontend\CustomerStatusDisplay;
use WEBLEVELUP_STATUS\Infrastructure\DefaultStatusSeeder;

final class Plugin {
  // Updated slug to match our new repository slug
  public const SLUG = 'wlu-custom-order-status-workflow';
  public const REST_NS = 'weblevelup-status/v1';

  public const DB_VERSION = '1.0.1';

  public static function init(): void {

    // 1. Initialize Store FIRST
    $store = new StatusesStore();

    // 2. SELF-HEALING & SEEDING CHECK
    // If DB version mismatch, run installer AND seeder
    if (get_option('weblevelup_status_db_version') !== self::DB_VERSION) {

         // Run standard table installer (if you have one)
         if (file_exists(WEBLEVELUP_STATUS_PATH . 'includes/Infrastructure/Installer.php')) {
             require_once WEBLEVELUP_STATUS_PATH . 'includes/Infrastructure/Installer.php';
             \WEBLEVELUP_STATUS\Infrastructure\Installer::install();
         }

         // Run the Seeder to populate default colors safely
         DefaultStatusSeeder::seed($store);

         // Update version so this doesn't run on every single page load
         update_option('weblevelup_status_db_version', self::DB_VERSION);
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


  }
}