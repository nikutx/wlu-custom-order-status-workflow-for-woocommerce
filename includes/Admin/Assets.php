<?php
namespace WLU_OW\Admin;

if (!defined('ABSPATH')) exit;

class Assets {
    public function enqueue() {
        $screen = get_current_screen();

        // Only load on our plugin page
        if (!$screen || strpos($screen->id, 'wlu-order-workflow') === false) {
            return;
        }

        $version = WLU_OW_VERSION;
        $url = WLU_OW_URL;
        $path = WLU_OW_PATH;

        // --- SMART MODE DETECTION ---
        if (file_exists($path . 'dist/app.js')) {
            $is_prod = true;
            $js_url = $url . 'dist/app.js';
            $css_url = $url . 'dist/app.css';
        } elseif (file_exists($path . 'dist/assets/app.js')) {
            $is_prod = true;
            $js_url = $url . 'dist/assets/app.js';
            $css_url = $url . 'dist/assets/app.css';
        } else {
            $is_prod = false;
        }

        if ($is_prod) {
            // --- PRODUCTION MODE ---
            wp_enqueue_script('wlu-ow-app', $js_url, ['wp-element', 'wp-i18n'], $version, true);
            wp_enqueue_style('wlu-ow-app', $css_url, [], $version);
        } else {
            // --- DEVELOPMENT MODE ---
            add_filter('script_loader_tag', function($tag, $handle, $src) {
                if (in_array($handle, ['wlu-ow-vite-client', 'wlu-ow-app'])) {
                    return '<script type="module" src="' . esc_url($src) . '"></script>';
                }
                return $tag;
            }, 10, 3);

            // Inject React Preamble
            add_action('admin_head', function() {
                echo '
                <script type="module">
                    import RefreshRuntime from "http://dev01.local:5173/@react-refresh"
                    RefreshRuntime.injectIntoGlobalHook(window)
                    window.$RefreshReg$ = () => {}
                    window.$RefreshSig$ = () => (type) => type
                    window.__vite_plugin_react_preamble_installed__ = true
                </script>';
            });

            wp_enqueue_script('wlu-ow-vite-client', 'http://dev01.local:5173/@vite/client', [], null, true);
            wp_enqueue_script('wlu-ow-app', 'http://dev01.local:5173/src/main.jsx', ['wp-element'], time(), true);
        }

        // --- 3. FULL SCREEN FIX (CSS) ---
        // This hides the default WP Title ("Custom Order Statuses...")
        // so your React App Sidebar becomes the only header.
        $css = "
            /* Hide WP Title */
            #wpbody-content > .wrap > h1 { display: none !important; }
            /* Remove notices spacer if empty */
            .wp-header-end { display: none !important; }
            /* Pull app up to the top */
            #wpbody-content > .wrap { margin-top: 0 !important; padding-top: 10px !important; }
        ";
        wp_add_inline_style('admin-bar', $css);

        // Pass settings
        wp_localize_script('wlu-ow-app', 'WLU_OW', [
            'restUrl' => rest_url('wlu-ow/v1/'),
            'nonce'   => wp_create_nonce('wp_rest'),
            'adminEmail' => get_option('admin_email'),
            'isPro'   => false
        ]);
    }
}