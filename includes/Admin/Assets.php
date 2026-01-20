<?php
namespace WLU_OW\Admin;

use WLU_OW\Plugin;

if (!defined('ABSPATH')) exit;

final class Assets {

  public function enqueue(string $hook): void {
    $expected_hook = 'toplevel_page_' . Plugin::SLUG;
    if ($hook !== $expected_hook) return;

    $config = [
      'restUrl'  => esc_url_raw(rest_url(Plugin::REST_NS . '/')),
      'nonce'    => wp_create_nonce('wp_rest'),
      'slug'     => Plugin::SLUG,
      'version'  => WLU_OW_VERSION,
    ];

    $is_dev = defined('WLU_OW_DEV') && WLU_OW_DEV;

    if ($is_dev) {
      add_action('admin_print_footer_scripts', function () use ($config) {
        echo '<script>window.WLU_OW=' . wp_json_encode($config) . ';</script>';

        echo '<script type="module" src="http://dev01.local:5173/@vite/client"></script>';

        echo '<script type="module">
          import RefreshRuntime from "http://dev01.local:5173/@react-refresh";
          RefreshRuntime.injectIntoGlobalHook(window);
          window.$RefreshReg$ = () => {};
          window.$RefreshSig$ = () => (type) => type;
          window.__vite_plugin_react_preamble_installed__ = true;
        </script>';

        echo '<script type="module" src="http://dev01.local:5173/src/main.jsx"></script>';
      }, 999);

      return;
    }

    // Production build from build/admin-app/
    $build_dir = WLU_OW_PATH . 'build/admin-app/';
    $build_url = WLU_OW_URL  . 'build/admin-app/';

    $manifest_path = $build_dir . 'manifest.json';
    if (!file_exists($manifest_path)) return;

    $manifest = json_decode((string) file_get_contents($manifest_path), true);
    if (!is_array($manifest)) return;

    $entry = $manifest['index.html'] ?? $manifest['src/main.jsx'] ?? null;
    if (!$entry || empty($entry['file'])) return;

    if (!empty($entry['css']) && is_array($entry['css'])) {
      foreach ($entry['css'] as $i => $css) {
        wp_enqueue_style('wlu-ow-admin-css-' . ($i + 1), $build_url . ltrim($css, '/'), [], null);
      }
    }

    wp_enqueue_script('wlu-ow-admin-js', $build_url . ltrim($entry['file'], '/'), [], null, true);
    wp_add_inline_script('wlu-ow-admin-js', 'window.WLU_OW=' . wp_json_encode($config) . ';', 'before');
  }
}
