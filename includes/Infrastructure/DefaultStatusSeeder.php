<?php
namespace WEBLEVELUP_STATUS\Infrastructure;

use WEBLEVELUP_STATUS\Domain\StatusesStore;

if (!defined('ABSPATH')) exit;

class DefaultStatusSeeder {

    /**
     * Standard WooCommerce statuses mapped to high-contrast colors
     * suitable for white text. Converted to a method to allow for translations.
     */
    private static function get_defaults(): array {
        return [
            'wc-pending'    => ['label' => __('Pending payment', 'wlu-custom-order-status-workflow'), 'color' => '#9e9e9e'],
            'wc-processing' => ['label' => __('Processing', 'wlu-custom-order-status-workflow'),      'color' => '#4caf50'],
            'wc-on-hold'    => ['label' => __('On hold', 'wlu-custom-order-status-workflow'),         'color' => '#ff9800'],
            'wc-completed'  => ['label' => __('Completed', 'wlu-custom-order-status-workflow'),       'color' => '#2196f3'],
            'wc-cancelled'  => ['label' => __('Cancelled', 'wlu-custom-order-status-workflow'),       'color' => '#616161'],
            'wc-refunded'   => ['label' => __('Refunded', 'wlu-custom-order-status-workflow'),        'color' => '#795548'],
            'wc-failed'     => ['label' => __('Failed', 'wlu-custom-order-status-workflow'),          'color' => '#f44336'],
        ];
    }

    public static function seed(StatusesStore $store): void {
        $current_statuses = $store->get_all();
        $is_dirty = false;

        // 1. Build a lookup list of existing slugs for fast checking
        $existing_slugs = array_map(function($s) {
            return $s['slug'];
        }, $current_statuses);

        // 2. Loop through defaults and add them ONLY if missing
        foreach (self::get_defaults() as $slug => $data) {
            if (!in_array($slug, $existing_slugs)) {
                $current_statuses[] = [
                    'id'    => uniqid('core_'), // Generate a unique ID
                    'slug'  => $slug,
                    'label' => $data['label'],
                    'color' => $data['color'],
                    'type'  => 'core' // Mark as core so UI knows
                ];
                $is_dirty = true;
            }
        }

        // 3. Save only if we added something new
        if ($is_dirty) {
            $store->save_all($current_statuses);
        }
    }
}