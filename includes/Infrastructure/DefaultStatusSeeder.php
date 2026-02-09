<?php
namespace WLU_OW\Infrastructure;

use WLU_OW\Domain\StatusesStore;

if (!defined('ABSPATH')) exit;

class DefaultStatusSeeder {

    /**
     * Standard WooCommerce statuses mapped to high-contrast colors
     * suitable for white text.
     */
    private const DEFAULTS = [
        'wc-pending'    => ['label' => 'Pending payment', 'color' => '#9e9e9e'], // Grey
        'wc-processing' => ['label' => 'Processing',      'color' => '#4caf50'], // Green
        'wc-on-hold'    => ['label' => 'On hold',         'color' => '#ff9800'], // Orange
        'wc-completed'  => ['label' => 'Completed',       'color' => '#2196f3'], // Blue
        'wc-cancelled'  => ['label' => 'Cancelled',       'color' => '#616161'], // Dark Grey
        'wc-refunded'   => ['label' => 'Refunded',        'color' => '#795548'], // Brownish Grey
        'wc-failed'     => ['label' => 'Failed',          'color' => '#f44336'], // Red
    ];

    public static function seed(StatusesStore $store): void {
        $current_statuses = $store->get_all();
        $is_dirty = false;

        // 1. Build a lookup list of existing slugs for fast checking
        $existing_slugs = array_map(function($s) {
            return $s['slug'];
        }, $current_statuses);

        // 2. Loop through defaults and add them ONLY if missing
        foreach (self::DEFAULTS as $slug => $data) {
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