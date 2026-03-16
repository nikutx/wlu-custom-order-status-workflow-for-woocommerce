<?php
namespace WEBLEVELUP_STATUS\Admin;

if (!defined('ABSPATH')) exit;

class AssetsDev {
    public static function enqueue_vite_dev_scripts() {
        add_filter('script_loader_tag', function($tag, $handle, $src) {
            if ($handle === 'weblevelup-status-vite-preamble') {
                return '<scr' . 'ipt type="module">
                    import RefreshRuntime from "http://dev01.local:5174/@react-refresh"
                    RefreshRuntime.injectIntoGlobalHook(window)
                    window.$RefreshReg$ = () => {}
                    window.$RefreshSig$ = () => (type) => type
                    window.__vite_plugin_react_preamble_installed__ = true
                </scr' . 'ipt>';
            }
            if (in_array($handle, ['weblevelup-status-vite-client', 'weblevelup-status-app'])) {
                return '<scr' . 'ipt type="module" src="' . esc_url($src) . '"></scr' . 'ipt>';
            }
            return $tag;
        }, 10, 3);

        wp_register_script('weblevelup-status-vite-preamble', 'http://dev01.local:5174/@react-refresh', [], null);
        wp_enqueue_script('weblevelup-status-vite-preamble');

        wp_enqueue_script('weblevelup-status-vite-client', 'http://dev01.local:5174/@vite/client', [], null, true);
        wp_enqueue_script('weblevelup-status-app', 'http://dev01.local:5174/src/main.jsx', ['wp-element'], time(), true);
    }
}