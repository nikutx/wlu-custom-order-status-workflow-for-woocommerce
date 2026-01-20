<?php
namespace WLU_OW\Admin;

use WLU_OW\Plugin;

if (!defined('ABSPATH')) exit;

final class Menu {

  private function required_capability(): string {
    return current_user_can('manage_woocommerce') ? 'manage_woocommerce' : 'manage_options';
  }

  public function register_menu(): void {
    add_menu_page(
      'Custom Order Statuses for WooCommerce',
      'Custom Statuses',
      $this->required_capability(),
      Plugin::SLUG,
      [$this, 'render_page'],
      'dashicons-chart-area',
      56
    );
  }

  public function render_page(): void {
    echo '<div class="wrap">';
    echo '<h1>Custom Order Statuses for WooCommerce</h1>';
    echo '<div id="wlu-ow-root"></div>';
    echo '</div>';
  }
}
