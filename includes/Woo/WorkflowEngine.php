<?php
namespace WLU_OW\Woo;

if (!defined('ABSPATH')) exit;

// --- FIX: FORCE LOAD THE DB STORE ---
require_once plugin_dir_path(__DIR__) . 'Domain/WorkflowRulesStore.php';
// ------------------------------------

use WLU_OW\Domain\WorkflowRulesStore;

class WorkflowEngine {

    public static function init() {
        // Hook into WooCommerce status changes
        add_action('woocommerce_order_status_changed', [__CLASS__, 'handle_status_change'], 10, 4);
    }

    /**
     * This runs every time an order status changes.
     */
    public static function handle_status_change($order_id, $from_status, $to_status, $order) {
        // 1. Get all active rules
        $rules = WorkflowRulesStore::get_all();

        // 2. Normalize Status (WC passes 'processing', we need 'wc-processing')
        $current_status_slug = 'wc-' . $to_status;

        foreach ($rules as $rule) {
            // Skip inactive
            if (!$rule->is_active) continue;

            // Check Trigger
            if ($rule->trigger_type === 'order_status_change' && $rule->trigger_value === $current_status_slug) {
                self::execute_rule($rule, $order);
            }
        }
    }

    private static function execute_rule($rule, $order) {
        // Decode payload if it's still a string (DB safety)
        $payload = is_string($rule->action_payload)
            ? json_decode($rule->action_payload, true)
            : (array) $rule->action_payload;

        if ($rule->action_type === 'send_email') {
            self::send_custom_email($order, $payload);
        }
    }

    private static function send_custom_email($order, $payload) {
        $to = $payload['to'] ?? 'customer';
        $subject = $payload['subject'] ?? 'Order Update';
        $body = $payload['body'] ?? '';

        // Resolve Recipient
        $recipient = $order->get_billing_email(); // Default to customer
        if ($to === 'admin') {
            $recipient = get_option('admin_email');
        } elseif ($to === 'custom' && !empty($payload['custom_email'])) {
            $recipient = $payload['custom_email'];
        }

        // Simple Template Processing (Replace variables)
        $placeholders = [
            '{order_number}' => $order->get_order_number(),
            '{customer_name}' => $order->get_billing_first_name(),
            '{order_total}' => $order->get_formatted_order_total(),
            '{status}' => $order->get_status()
        ];

        foreach ($placeholders as $key => $val) {
            $subject = str_replace($key, $val, $subject);
            $body = str_replace($key, $val, $body);
        }

        // Use WooCommerce Mailer
        $mailer = WC()->mailer();

        // Wrap message in WC default template style
        $message = $mailer->wrap_message($subject, $body);

        // Send!
        $mailer->send($recipient, $subject, $message);
    }
}