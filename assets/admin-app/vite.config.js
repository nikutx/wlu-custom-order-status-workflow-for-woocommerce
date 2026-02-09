import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],

  // 1. CRITICAL: Makes sure assets load correctly relative to the plugin folder
  base: './',

  server: {
    // --- Keep your existing LocalWP settings ---
    host: "dev01.local",
    port: 5173,
    strictPort: true,
    cors: {
      origin: "http://dev01.local",
      credentials: true,
    },
    hmr: {
      host: "dev01.local",
      protocol: "ws",
      port: 5173,
    },
  },

  build: {
    // 2. Output to 'dist' folder in plugin root
    outDir: path.resolve(__dirname, "../../dist"),
    emptyOutDir: true,

    // We don't need manifest anymore because we are forcing consistent filenames
    manifest: false,

    rollupOptions: {
      input: path.resolve(__dirname, "index.html"),
      output: {
        // 3. Force consistent filenames so PHP always knows what to load
        entryFileNames: 'app.js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'app.css';
          }
          return '[name][extname]';
        },
      },
    },
  },
});