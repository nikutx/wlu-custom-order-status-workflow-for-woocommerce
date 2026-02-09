<?php
namespace WLU_OW\Rest;

use WP_REST_Request;
use WP_REST_Response;
use WLU_OW\Domain\WorkflowRulesStore;

if (!defined('ABSPATH')) exit;
require_once plugin_dir_path(__DIR__) . 'Domain/WorkflowRulesStore.php';
class WorkflowRulesController {

    public static function register_routes() {
        register_rest_route('wlu-ow/v1', '/rules', [
            [
                'methods' => 'GET',
                'callback' => [__CLASS__, 'get_items'],
                'permission_callback' => [__CLASS__, 'check_permission']
            ],
            [
                'methods' => 'POST',
                'callback' => [__CLASS__, 'create_item'],
                'permission_callback' => [__CLASS__, 'check_permission']
            ]
        ]);

        register_rest_route('wlu-ow/v1', '/rules/(?P<id>\d+)', [
            [
                'methods' => 'DELETE',
                'callback' => [__CLASS__, 'delete_item'],
                'permission_callback' => [__CLASS__, 'check_permission']
            ],
             [
                'methods' => 'PATCH', // Used for toggling Active/Inactive
                'callback' => [__CLASS__, 'update_item'],
                'permission_callback' => [__CLASS__, 'check_permission']
            ]
        ]);
    }

    public static function get_items() {
        $rules = WorkflowRulesStore::get_all();
        // Decode the JSON payloads so React receives real objects, not strings
        foreach ($rules as $rule) {
            $rule->action_payload = json_decode($rule->action_payload);
            $rule->is_active = (bool) $rule->is_active;
        }
        return new WP_REST_Response($rules, 200);
    }

    public static function create_item(WP_REST_Request $request) {
        $data = $request->get_json_params();

                // --- LIMIT CHECK START ---
                $existing_rules = WorkflowRulesStore::get_all();
                // Allow max 2 rules if Pro class doesn't exist
                if (count($existing_rules) >= 2 && !class_exists('WLU_OW_Pro')) {
                    return new \WP_Error('wlu_pro_limit', 'Free version limit reached (2 rules). Upgrade to Pro for unlimited automation!', ['status' => 403]);
                }
                // -------------------------

                // Basic Validation
                if (empty($data['name']) || empty($data['trigger_type'])) {
                    return new \WP_Error('missing_params', 'Name and Trigger are required', ['status' => 400]);
                }

        $new_rule = WorkflowRulesStore::create($data);
        if (!$new_rule) {
            return new \WP_Error('db_error', 'Could not save rule', ['status' => 500]);
        }

        $new_rule->action_payload = json_decode($new_rule->action_payload);
        $new_rule->is_active = (bool) $new_rule->is_active;

        return new WP_REST_Response($new_rule, 201);
    }

    public static function delete_item(WP_REST_Request $request) {
        $id = $request->get_param('id');
        WorkflowRulesStore::delete($id);
        return new WP_REST_Response(['deleted' => true], 200);
    }

    public static function update_item(WP_REST_Request $request) {
        $id = $request->get_param('id');
        $data = $request->get_json_params();
        $updated = WorkflowRulesStore::update($id, $data);
        return new WP_REST_Response($updated, 200);
    }

    public static function check_permission() {
        return current_user_can('manage_woocommerce');
    }
}