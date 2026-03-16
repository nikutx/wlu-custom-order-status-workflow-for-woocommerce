<?php
namespace WEBLEVELUP_STATUS\Admin;

use WEBLEVELUP_STATUS\Domain\StatusesStore;

if (!defined('ABSPATH')) exit;

class StatusColorInjector {
    private $store;

    public function __construct(StatusesStore $store) {
        $this->store = $store;
    }

    public function init() {
        // Correct WordPress hook for enqueuing admin styles
        add_action('admin_enqueue_scripts', [$this, 'inject_css']);
    }

    public function inject_css() {
        $screen = get_current_screen();
        // Only run on WooCommerce order lists or order edit pages
        if (!$screen || ($screen->id !== 'shop_order' && $screen->id !== 'woocommerce_page_wc-orders')) {
            return;
        }

        // --- 1. SETTINGS CHECK ---
        $settings = get_option('weblevelup_status_options', []);
        $is_enabled = isset($settings['enableAdminColors']) ? (bool)$settings['enableAdminColors'] : true;

        if ( ! $is_enabled ) {
            return;
        }

        // --- 2. GENERATE DYNAMIC CSS ---
        $statuses = $this->store->get_all();
        $custom_css = '';

        foreach ($statuses as $status) {
            if (empty($status['color'])) continue;

            $css_slug = sanitize_html_class(str_replace('wc-', '', $status['slug']));
            $color = esc_attr($status['color']);

            // Safely build the CSS string
            $custom_css .= ".order-status.status-{$css_slug} { background: {$color} !important; color: #ffffff !important; }\n";
            $custom_css .= ".order-status.status-{$css_slug} span { color: #ffffff !important; }\n";
        }

        // --- 3. ENQUEUE THE CSS PROPERLY ---
        if (!empty($custom_css)) {
            // Registering a style with 'false' as the source is the official WP way to handle purely dynamic inline styles.
            wp_register_style('weblevelup-status-admin-status-colors', false);
            wp_enqueue_style('weblevelup-status-admin-status-colors');
            wp_add_inline_style('weblevelup-status-admin-status-colors', $custom_css);
        }
    }
}