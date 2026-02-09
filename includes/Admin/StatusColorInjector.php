<?php
namespace WLU_OW\Admin;

use WLU_OW\Domain\StatusesStore;

class StatusColorInjector {
    private $store;

    public function __construct(StatusesStore $store) {
        $this->store = $store;
    }

    public function init() {
        add_action('admin_head', [$this, 'inject_css']);
    }

    public function inject_css() {
        $screen = get_current_screen();
        // Only run on WooCommerce order lists or order edit pages
        if (!$screen || ($screen->id !== 'shop_order' && $screen->id !== 'woocommerce_page_wc-orders')) {
            return;
        }

        // --- 1. SETTINGS CHECK (Fixed) ---

        // We use 'wlu_ow_options' because that is what SettingsController.php uses.
        $settings = get_option('wlu_ow_options', []);

        // We check 'enableAdminColors' because that is the key your React app saves.
        // Default to TRUE so colors work out-of-the-box before settings are saved.
        $is_enabled = isset($settings['enableAdminColors']) ? (bool)$settings['enableAdminColors'] : true;

        // If disabled, stop here.
        if ( ! $is_enabled ) {
            return;
        }

        // --- 2. INJECT CSS ---

        $statuses = $this->store->get_all();

        echo '<style type="text/css">';
        foreach ($statuses as $status) {
            if (empty($status['color'])) continue;

            // Strip 'wc-' prefix to match WooCommerce CSS classes
            $css_slug = str_replace('wc-', '', $status['slug']);
            $color = esc_attr($status['color']);

            echo ".order-status.status-{$css_slug} {";
            echo "background: {$color} !important;";
            echo "color: #ffffff !important;"; // Force white text for contrast
            echo "}";

            echo ".order-status.status-{$css_slug} span {";
            echo "color: #ffffff !important;";
            echo "}";
        }
        echo '</style>';
    }
}