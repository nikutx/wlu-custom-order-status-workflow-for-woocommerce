<?php
namespace WLU_OW\Domain;

if (!defined('ABSPATH')) exit;

class WorkflowRulesStore {

    private static $table_name;

    private static function get_table() {
        global $wpdb;
        return $wpdb->prefix . 'wlu_workflow_rules';
    }

    public static function get_all() {
        global $wpdb;
        $table = self::get_table();
        // Get all rules, newest first
        return $wpdb->get_results("SELECT * FROM $table ORDER BY id DESC");
    }

    public static function create($data) {
        global $wpdb;
        $table = self::get_table();

        $inserted = $wpdb->insert($table, [
            'name'           => sanitize_text_field($data['name']),
            'trigger_type'   => sanitize_text_field($data['trigger_type']),
            'trigger_value'  => sanitize_text_field($data['trigger_value']),
            'action_type'    => sanitize_text_field($data['action_type']),
            // We store the payload as a JSON string
            'action_payload' => json_encode($data['action_payload'] ?? []),
            'is_active'      => !empty($data['is_active']) ? 1 : 0
        ]);

        if ($inserted === false) {
            return false;
        }

        $id = $wpdb->insert_id;
        return self::get_by_id($id);
    }

    public static function get_by_id($id) {
        global $wpdb;
        $table = self::get_table();
        $sql = $wpdb->prepare("SELECT * FROM $table WHERE id = %d", $id);
        return $wpdb->get_row($sql);
    }

    public static function delete($id) {
        global $wpdb;
        $table = self::get_table();
        return $wpdb->delete($table, ['id' => $id]);
    }

    public static function update($id, $data) {
            global $wpdb;
            $table = self::get_table();

            $update_data = [];
            if (isset($data['name'])) $update_data['name'] = sanitize_text_field($data['name']);
            if (isset($data['trigger_type'])) $update_data['trigger_type'] = sanitize_text_field($data['trigger_type']);
            if (isset($data['trigger_value'])) $update_data['trigger_value'] = sanitize_text_field($data['trigger_value']);
            if (isset($data['action_type'])) $update_data['action_type'] = sanitize_text_field($data['action_type']);
            if (isset($data['action_payload'])) $update_data['action_payload'] = json_encode($data['action_payload']);
            if (isset($data['is_active'])) $update_data['is_active'] = $data['is_active'] ? 1 : 0;

            if (empty($update_data)) return false;

            $wpdb->update($table, $update_data, ['id' => $id]);
            return self::get_by_id($id);
        }
}