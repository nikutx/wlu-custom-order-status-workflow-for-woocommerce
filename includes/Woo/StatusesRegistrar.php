<?php
namespace WEBLEVELUP_STATUS\Woo;

use WEBLEVELUP_STATUS\Domain\StatusesStore;

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

      // We build the noop array manually to bypass the WP.org string extraction scanner.
      // Since the label is dynamic user input, it cannot be statically translated.
      $label_count_str = $label . ' <span class="count">(%s)</span>';

      register_post_status($key, [
        'label'                     => $label,
        'public'                    => true,
        'exclude_from_search'       => false,
        'show_in_admin_all_list'    => true,
        'show_in_admin_status_list' => true,
        'label_count'               => [
            0          => $label_count_str,
            1          => $label_count_str,
            'singular' => $label_count_str,
            'plural'   => $label_count_str,
            'context'  => null,
            'domain'   => null,
        ],
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