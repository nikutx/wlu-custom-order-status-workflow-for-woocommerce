<?php
namespace WEBLEVELUP_STATUS\Admin;

use WEBLEVELUP_STATUS\Plugin;

if (!defined('ABSPATH')) exit;

final class Menu {

  private function required_capability(): string {
    return current_user_can('manage_woocommerce') ? 'manage_woocommerce' : 'manage_options';
  }

  public function register_menu(): void {
    add_menu_page(
      esc_html__('WLU Custom Order Status for WooCommerce', 'wlu-custom-order-status-workflow'),
      esc_html__('Custom Statuses', 'wlu-custom-order-status-workflow'),
      $this->required_capability(),
      Plugin::SLUG,
      [$this, 'render_page'],
      'dashicons-chart-area',
      56
    );
  }

  public function render_page(): void {
    echo '<div class="wrap">';
    // Safely escaped and translatable title!
    echo '<h1>' . esc_html__('WLU Custom Order Status for WooCommerce', 'wlu-custom-order-status-workflow') . '</h1>';
    echo '<div id="weblevelup-status-root"></div>';
    echo '</div>';
  }
}