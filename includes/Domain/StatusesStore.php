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
    $slug = sanitize_key($slug);
    $slug = ltrim($slug, '-');
    return 'wc-' . $slug;
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
