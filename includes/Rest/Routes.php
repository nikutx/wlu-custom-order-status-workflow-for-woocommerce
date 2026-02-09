<?php
namespace WLU_OW\Rest;

use WP_Error;
use WP_REST_Request;
use WLU_OW\Plugin;
use WLU_OW\Domain\StatusesStore;

if (!defined('ABSPATH')) exit;

final class Routes {
  private StatusesStore $store;

  // Define Core Slugs to ignore in limits
  private const CORE_SLUGS = [
      'wc-pending', 'wc-processing', 'wc-on-hold',
      'wc-completed', 'wc-cancelled', 'wc-refunded', 'wc-failed'
  ];

  public function __construct(StatusesStore $store) {
    $this->store = $store;
  }

  private function can_manage(): bool {
    $cap = current_user_can('manage_woocommerce') ? 'manage_woocommerce' : 'manage_options';
    return current_user_can($cap);
  }

  private function slugify(string $input): string {
    $slug = strtolower(trim($input));
    $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
    $slug = preg_replace('/(^-|-$)+/', '', $slug);

    if (strlen($slug) > 17) {
        $slug = substr($slug, 0, 17);
        $slug = rtrim($slug, '-');
    }
    return $slug ?? '';
  }

  private function slug_exists(array $statuses, string $slug, ?string $excludeId = null): bool {
    foreach ($statuses as $s) {
      $sid = (string)($s['id'] ?? '');
      $sslug = (string)($s['slug'] ?? '');
      if ($excludeId !== null && $sid === $excludeId) continue;
      if ($sslug !== '' && $sslug === $slug) return true;
    }
    return false;
  }

  private function uniqueify_slug(array $statuses, string $baseSlug, ?string $excludeId = null): string {
    $baseSlug = $this->slugify($baseSlug);
    if ($baseSlug === '') return '';

    $try = $baseSlug;
    $n = 2;
    while ($this->slug_exists($statuses, $try, $excludeId)) {
      $suffix = "-$n";
      $allowedBase = 17 - strlen($suffix);
      $try = substr($baseSlug, 0, $allowedBase) . $suffix;
      $n++;
    }
    return $try;
  }

  private function get_live_counts(): array {
      global $wpdb;

      $counts = [];
      $hpos_table = $wpdb->prefix . 'wc_orders';

      // Check for HPOS (High Performance Order Storage)
      if ($wpdb->get_var("SHOW TABLES LIKE '$hpos_table'") === $hpos_table) {
          $results = $wpdb->get_results("SELECT status, COUNT(*) as cnt FROM $hpos_table GROUP BY status", ARRAY_A);
          if ($results) {
              foreach ($results as $row) {
                  $status = $row['status'];
                  if (str_starts_with($status, 'wc-')) {
                      $status = substr($status, 3);
                  }
                  $key = 'wc-' . $status;
                  $counts[$key] = (int)$row['cnt'];
              }
              return $counts;
          }
      }

      // Fallback to Post Meta (Legacy)
      $results = $wpdb->get_results(
          "SELECT post_status, COUNT(*) as cnt
           FROM {$wpdb->posts}
           WHERE post_type = 'shop_order'
           GROUP BY post_status",
          ARRAY_A
      );

      foreach ($results as $row) {
          $status = $row['post_status'];
          if (str_starts_with($status, 'wc-')) {
              $status = substr($status, 3);
          }
          $key = 'wc-' . $status;
          $counts[$key] = (int)$row['cnt'];
      }

      return $counts;
  }

  public function register(): void {

    // Register Sub-Controllers
    if (file_exists(__DIR__ . '/WorkflowRulesController.php')) {
        require_once __DIR__ . '/WorkflowRulesController.php';
        WorkflowRulesController::register_routes();
    }

    if (file_exists(__DIR__ . '/SettingsController.php')) {
        require_once __DIR__ . '/SettingsController.php';
        SettingsController::register_routes();
    }

    // GET /ping
    register_rest_route(Plugin::REST_NS, '/ping', [
      'methods' => 'GET',
      'permission_callback' => fn() => current_user_can('manage_options'),
      'callback' => fn() => rest_ensure_response(['ok' => true, 'time' => current_time('mysql')]),
    ]);

    // GET /statuses
    register_rest_route(Plugin::REST_NS, '/statuses', [
      'methods' => 'GET',
      'permission_callback' => fn() => $this->can_manage(),
      'callback' => function () {
        $statuses = $this->store->get_all();
        $counts = $this->get_live_counts();

        foreach ($statuses as &$s) {
            $slug = (string)($s['slug'] ?? '');
            $key = $this->store->wc_key_from_slug($slug);
            $s['count'] = (int) ($counts[$key] ?? 0);
        }
        unset($s);

        usort($statuses, function ($a, $b) {
          $sa = (int)($a['sort'] ?? 0);
          $sb = (int)($b['sort'] ?? 0);
          if ($sa !== $sb) return $sa <=> $sb;
          return strcmp((string)($a['label'] ?? ''), (string)($b['label'] ?? ''));
        });

        return rest_ensure_response($statuses);
      },
    ]);

    // POST /statuses (Create or Override)
    register_rest_route(Plugin::REST_NS, '/statuses', [
      'methods' => 'POST',
      'permission_callback' => fn() => $this->can_manage(),
      'callback' => function (WP_REST_Request $req) {
        $in = (array)$req->get_json_params();
        $statuses = $this->store->get_all();

        // --- LIMIT CHECK FIX ---

        // 1. Is the incoming status a Core Status?
        $incomingSlug = $in['slug'] ?? '';
        $isCoreOverride = in_array($incomingSlug, self::CORE_SLUGS);

        // 2. Count current CUSTOM statuses only (exclude existing core overrides)
        $customCount = 0;
        foreach ($statuses as $s) {
            if (!in_array($s['slug'], self::CORE_SLUGS)) {
                $customCount++;
            }
        }

        // 3. Enforce Limit: Only if creating NEW CUSTOM status and limit reached
        if (!$isCoreOverride && $customCount >= 2 && !class_exists('WLU_OW_Pro')) {
             return new WP_Error('wlu_pro_limit', 'Free version limit reached (2 statuses). Upgrade to Pro for unlimited workflows!', ['status' => 403]);
        }
        // -----------------------

        $status = $this->store->sanitize_payload($in);
        if (empty($status['label'])) return new WP_Error('wlu_invalid', 'label is required', ['status' => 400]);

        $slug = (string)($status['slug'] ?? '');
        $slug = $this->slugify($slug);
        if ($slug === '') $slug = $this->slugify((string)$status['label']);
        if ($slug === '') return new WP_Error('wlu_invalid', 'could not generate slug', ['status' => 400]);

        $status['slug'] = $this->uniqueify_slug($statuses, $slug);
        $statuses[] = $status;
        $this->store->save_all($statuses);

        return rest_ensure_response($status);
      },
    ]);

    // UPDATE + DELETE /statuses/{id}
    register_rest_route(Plugin::REST_NS, '/statuses/(?P<id>[^/]+)', [
      [
        'methods' => ['PUT', 'PATCH', 'POST'],
        'permission_callback' => fn() => $this->can_manage(),
        'callback' => function (WP_REST_Request $req) {
          $id = (string)$req->get_param('id');
          $in = (array)$req->get_json_params();

          $statuses = $this->store->get_all();
          $foundIndex = null;
          $existing = null;

          foreach ($statuses as $i => $s) {
            if ((string)($s['id'] ?? '') === $id) {
              $foundIndex = $i;
              $existing = $s;
              break;
            }
          }

          if ($foundIndex === null) return new WP_Error('wlu_not_found', 'Status not found', ['status' => 404]);

          $updated = $this->store->sanitize_payload($in, $existing);
          $updated['id'] = $id;
          if (empty($updated['label'])) return new WP_Error('wlu_invalid', 'label is required', ['status' => 400]);

          $updated['slug'] = $existing['slug']; // Prevent slug changes on update

          $statuses[$foundIndex] = $updated;
          $this->store->save_all($statuses);
          return rest_ensure_response($updated);
        },
      ],
      [
        'methods' => ['DELETE', 'POST'],
        'permission_callback' => fn() => $this->can_manage(),
        'callback' => function (WP_REST_Request $req) {
          $id = (string)$req->get_param('id');
          $reassignTo = (string)$req->get_param('reassign');

          $statuses = $this->store->get_all();
          $target = null;
          foreach ($statuses as $s) {
              if ((string)($s['id'] ?? '') === $id) {
                  $target = $s;
                  break;
              }
          }
          if (!$target) return new WP_Error('wlu_not_found', 'Status not found', ['status' => 404]);

          if (!empty($reassignTo)) {
              $oldKey = $this->store->wc_key_from_slug($target['slug']);
              $newKey = sanitize_key($reassignTo);

              $orders = wc_get_orders(['status' => $oldKey, 'limit' => -1, 'return' => 'ids']);
              foreach($orders as $oid) {
                  $ord = wc_get_order($oid);
                  $ord->update_status($newKey, 'WLU Reassigned from ' . $target['label']);
              }
          }

          $statuses = array_values(array_filter($statuses, fn($s) => (string)($s['id'] ?? '') !== $id));
          $this->store->save_all($statuses);

          return rest_ensure_response(['ok' => true, 'id' => $id]);
        },
      ],
    ]);
  }
}