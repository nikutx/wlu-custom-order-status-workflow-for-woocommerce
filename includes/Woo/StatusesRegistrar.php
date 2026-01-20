<?php
namespace WLU_OW\Woo;

use WLU_OW\Domain\StatusesStore;

if (!defined('ABSPATH')) exit;

final class StatusesRegistrar {
  private StatusesStore $store;

  public function __construct(StatusesStore $store) {
    $this->store = $store;
  }

  public function register_post_statuses(): void {
    if (!function_exists('wc_get_order_statuses')) return;

    foreach ($this->store->get_all() as $s) {
      if (empty($s['enabled'])) continue;

      $slug  = (string)($s['slug'] ?? '');
      $label = (string)($s['label'] ?? '');
      if ($slug === '' || $label === '') continue;

      $key = $this->store->wc_key_from_slug($slug);

      register_post_status($key, [
        'label'                     => $label,
        'public'                    => true,
        'exclude_from_search'       => false,
        'show_in_admin_all_list'    => true,
        'show_in_admin_status_list' => true,
        'label_count'               => _n_noop(
          $label . ' <span class="count">(%s)</span>',
          $label . ' <span class="count">(%s)</span>'
        ),
      ]);
    }
  }

  public function filter_wc_order_statuses(array $statuses): array {
    foreach ($this->store->get_all() as $s) {
      if (empty($s['enabled'])) continue;

      $slug  = (string)($s['slug'] ?? '');
      $label = (string)($s['label'] ?? '');
      if ($slug === '' || $label === '') continue;

      $key = $this->store->wc_key_from_slug($slug);
      $statuses[$key] = $label;
    }

    return $statuses;
  }
}
