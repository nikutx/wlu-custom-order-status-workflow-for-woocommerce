<?php
namespace WLU_OW\Domain;

if (!defined('ABSPATH')) exit;

final class StatusesStore {
  private const OPT_STATUSES = 'wlu_ow_order_statuses';

  public function get_all(): array {
    $raw = get_option(self::OPT_STATUSES, []);
    return is_array($raw) ? $raw : [];
  }

  public function save_all(array $statuses): void {
    update_option(self::OPT_STATUSES, array_values($statuses), false);
  }

public function wc_key_from_slug(string $slug): string {
    // 1. Sanitize to strictly lowercase alpha-numeric-dash
    $clean = preg_replace('/[^a-z0-9-]/', '', strtolower($slug));

    // 2. Remove any accidentally typed 'wc-' prefix to avoid 'wc-wc-something'
    if (str_starts_with($clean, 'wc-')) {
        return $clean;
    }

    return 'wc-' . $clean;
  }

  public function sanitize_payload(array $in, ?array $existing = null): array {
    $id = isset($existing['id'])
      ? (string)$existing['id']
      : (string)($in['id'] ?? wp_generate_uuid4());

    $slug  = sanitize_key((string)($in['slug'] ?? ($existing['slug'] ?? '')));
    $label = sanitize_text_field((string)($in['label'] ?? ($existing['label'] ?? '')));

    $color = (string)($in['color'] ?? ($existing['color'] ?? '#22C55E'));
    $color = preg_match('/^#[0-9a-fA-F]{6}$/', $color) ? $color : '#22C55E';

    $enabled = isset($in['enabled']) ? (bool)$in['enabled'] : (bool)($existing['enabled'] ?? true);
    $sort    = isset($in['sort']) ? (int)$in['sort'] : (int)($existing['sort'] ?? 0);

    return [
      'id'      => $id,
      'slug'    => $slug,
      'label'   => $label,
      'color'   => $color,
      'enabled' => $enabled,
      'sort'    => $sort,
    ];
  }
}
