<?php
namespace WEBLEVELUP_STATUS\Infrastructure;

if (!defined('ABSPATH')) exit;

class Installer {

    public static function install() {
        add_option('weblevelup_status_db_version', '1.0.1');
    }
}