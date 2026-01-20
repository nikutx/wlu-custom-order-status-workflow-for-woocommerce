<?php
namespace WLU_OW\Rest;

use WP_Error;
use WP_REST_Request;
use WLU_OW\Plugin;
use WLU_OW\Domain\StatusesStore;

if (!defined('ABSPATH')) exit;

final class Routes {
  private StatusesStore $store;

  public function __construct(StatusesStore $store) {
    $this->store = $store;
  }

  private function can_manage(): bool {
    $cap = current_user_can('manage_woocommerce') ? 'manage_woocommerce' : 'manage_options';
    return current_user_can($cap);
  }

  public function register(): void {

    register_rest_route(Plugin::REST_NS, '/ping', [
      'methods' => 'GET',
      'permission_callback' => fn() => current_user_can('manage_options'),
      'callback' => fn() => rest_ensure_response([
        'ok' => true,
        'time' => current_time('mysql'),
      ]),
    ]);

    // GET /statuses
    register_rest_route(Plugin::REST_NS, '/statuses', [
      'methods' => 'GET',
      'permission_callback' => fn() => $this->can_manage(),
      'callback' => function () {
        $statuses = $this->store->get_all();

        usort($statuses, function ($a, $b) {
          $sa = (int)($a['sort'] ?? 0);
          $sb = (int)($b['sort'] ?? 0);
          if ($sa !== $sb) return $sa <=> $sb;
          return strcmp((string)($a['label'] ?? ''), (string)($b['label'] ?? ''));
        });

        return rest_ensure_response($statuses);
      },
    ]);

    // POST /statuses
    register_rest_route(Plugin::REST_NS, '/statuses', [
      'methods' => 'POST',
      'permission_callback' => fn() => $this->can_manage(),
      'callback' => function (WP_REST_Request $req) {
        $in = (array)$req->get_json_params();
        $status = $this->store->sanitize_payload($in);

        if (empty($status['slug']) || empty($status['label'])) {
          return new WP_Error('wlu_invalid', 'slug and label are required', ['status' => 400]);
        }

        $statuses = $this->store->get_all();

        foreach ($statuses as $s) {
          if (($s['slug'] ?? '') === $status['slug']) {
            return new WP_Error('wlu_exists', 'A status with that slug already exists', ['status' => 409]);
          }
        }

        $statuses[] = $status;
        $this->store->save_all($statuses);

        return rest_ensure_response($status);
      },
    ]);

    // PUT /statuses/{id}
    register_rest_route(Plugin::REST_NS, '/statuses/(?P<id>[a-zA-Z0-9\-]+)', [
      'methods' => 'PUT',
      'permission_callback' => fn() => $this->can_manage(),
      'callback' => function (WP_REST_Request $req) {
        $id = (string)$req['id'];
        $in = (array)$req->get_json_params();

        $statuses = $this->store->get_all();
        $found = false;

        foreach ($statuses as $i => $s) {
          if (($s['id'] ?? '') === $id) {
            $updated = $this->store->sanitize_payload($in, $s);

            if (empty($updated['slug']) || empty($updated['label'])) {
              return new WP_Error('wlu_invalid', 'slug and label are required', ['status' => 400]);
            }

            foreach ($statuses as $j => $other) {
              if ($j === $i) continue;
              if (($other['slug'] ?? '') === $updated['slug']) {
                return new WP_Error('wlu_exists', 'A status with that slug already exists', ['status' => 409]);
              }
            }

            $statuses[$i] = $updated;
            $found = true;
            break;
          }
        }

        if (!$found) {
          return new WP_Error('wlu_not_found', 'Status not found', ['status' => 404]);
        }

        $this->store->save_all($statuses);
        return rest_ensure_response($statuses);
      },
    ]);

    // DELETE /statuses/{id}
    register_rest_route(Plugin::REST_NS, '/statuses/(?P<id>[a-zA-Z0-9\-]+)', [
      'methods' => 'DELETE',
      'permission_callback' => fn() => $this->can_manage(),
      'callback' => function (WP_REST_Request $req) {
        $id = (string)$req['id'];

        $statuses = $this->store->get_all();
        $before = count($statuses);

        $statuses = array_values(array_filter($statuses, fn($s) => ($s['id'] ?? '') !== $id));

        if (count($statuses) === $before) {
          return new WP_Error('wlu_not_found', 'Status not found', ['status' => 404]);
        }

        $this->store->save_all($statuses);
        return rest_ensure_response(['ok' => true]);
      },
    ]);
  }
}
