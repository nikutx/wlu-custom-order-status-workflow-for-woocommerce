<?php
namespace WEBLEVELUP_STATUS\Frontend;

use WEBLEVELUP_STATUS\Domain\StatusesStore;

if (!defined('ABSPATH')) exit;

class CustomerStatusDisplay {
    private $store;

    public function __construct(StatusesStore $store) {
        $this->store = $store;
    }

    public function init() {
        // FIX: this is an Action, not a Filter. It receives 1 argument: $order
        add_action('woocommerce_my_account_my_orders_column_order-status', [$this, 'output_status_badge'], 10, 1);

        // Hook to inject CSS properly using the standard frontend script enqueuer
        add_action('wp_enqueue_scripts', [$this, 'inject_frontend_css']);
    }

    /**
     * Outputs the status HTML directly.
     * Replaces standard WooCommerce text output for this column.
     */
    public function output_status_badge($order) {
        // 1. Get the status label (e.g. "Processing")
        $slug = $order->get_status();
        $status_name = wc_get_order_status_name($slug);

        // 2. Check if our feature is enabled
        if (!$this->is_enabled()) {
            // If disabled, just print the plain text like WooCommerce normally does
            echo esc_html($status_name);
            return;
        }

        // 3. Output the Badge HTML
        // We strip 'wc-' just in case, to match our CSS classes
        $clean_slug = str_replace('wc-', '', $slug);

        printf(
            '<span class="wlu-status-badge status-%s">%s</span>',
            esc_attr($clean_slug),
            esc_html($status_name)
        );
    }

    public function inject_frontend_css() {
        // Only run on My Account pages
        if (!function_exists('is_account_page') || !is_account_page()) {
            return;
        }

        if (!$this->is_enabled()) {
            return;
        }

        $statuses = $this->store->get_all();
        $custom_css = '';

        // A. Base Badge Styles (The "Pill" Shape)
        $custom_css .= "
            .wlu-status-badge {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 0.85em;
                font-weight: 600;
                line-height: 1.5;
                text-align: center;
                background: #e5e5e5;
                color: #333;
                white-space: nowrap;
            }
        ";

        // B. Dynamic Colors
        foreach ($statuses as $status) {
            if (empty($status['color'])) continue;

            // Sanitize the slug for safe CSS class output
            $css_slug = sanitize_html_class(str_replace('wc-', '', $status['slug']));
            $color = esc_attr($status['color']);

            // Note: We use !important to ensure theme styles don't override our badge
            $custom_css .= ".wlu-status-badge.status-{$css_slug} { background-color: {$color} !important; color: #ffffff !important; }\n";
        }

        // C. Enqueue the compiled CSS string
        if (!empty($custom_css)) {
            // Register a dummy handle, then attach our dynamic inline styles to it
            wp_register_style('weblevelup-status-frontend-status-colors', false);
            wp_enqueue_style('weblevelup-status-frontend-status-colors');
            wp_add_inline_style('weblevelup-status-frontend-status-colors', $custom_css);
        }
    }

    private function is_enabled(): bool {
        $settings = get_option('weblevelup_status_options', []);
        return isset($settings['enableFrontendColors']) ? (bool)$settings['enableFrontendColors'] : true;
    }
}