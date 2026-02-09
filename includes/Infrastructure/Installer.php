<?php
namespace WLU_OW\Infrastructure;

if (!defined('ABSPATH')) exit;

class Installer {

    public static function install() {
        global $wpdb;
        $table_name = $wpdb->prefix . 'wlu_workflow_rules';
        $charset_collate = $wpdb->get_charset_collate();

        // The SQL Schema for our "Zapier" Rules
        $sql = "CREATE TABLE $table_name (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            name varchar(255) NOT NULL,
            trigger_type varchar(50) NOT NULL,
            trigger_value varchar(255) NOT NULL,
            action_type varchar(50) NOT NULL,
            action_payload longtext NOT NULL,
            is_active tinyint(1) DEFAULT 1 NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
            PRIMARY KEY  (id)
        ) $charset_collate;";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);

        // Add DB version option for future upgrades
        add_option('wlu_ow_db_version', '1.0.0');
    }
}