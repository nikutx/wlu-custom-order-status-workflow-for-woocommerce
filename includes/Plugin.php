<?php
namespace WLU_OW;

if (!defined('ABSPATH')) exit;

require_once WLU_OW_PATH . 'includes/Admin/Menu.php';
require_once WLU_OW_PATH . 'includes/Admin/Assets.php';
require_once WLU_OW_PATH . 'includes/Domain/StatusesStore.php';
require_once WLU_OW_PATH . 'includes/Woo/StatusesRegistrar.php';
require_once WLU_OW_PATH . 'includes/Rest/Routes.php';

use WLU_OW\Admin\Menu;
use WLU_OW\Admin\Assets;
use WLU_OW\Domain\StatusesStore;
use WLU_OW\Woo\StatusesRegistrar;
use WLU_OW\Rest\Routes;

final class Plugin {
  public const SLUG = 'wlu-order-workflow';
  public const REST_NS = 'wlu-ow/v1';

  public static function init(): void {
    $store = new StatusesStore();
    $menu  = new Menu();
    $assets = new Assets();
    $woo   = new StatusesRegistrar($store);
    $rest  = new Routes($store);

    add_action('admin_menu', [$menu, 'register_menu']);
    add_action('admin_enqueue_scripts', [$assets, 'enqueue']);

    add_action('init', [$woo, 'register_post_statuses'], 9);
    add_filter('wc_order_statuses', [$woo, 'filter_wc_order_statuses']);

    add_action('rest_api_init', [$rest, 'register']);
  }
}
