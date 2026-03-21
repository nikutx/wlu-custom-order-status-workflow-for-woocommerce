import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  base: './',

  server: {
    host: "dev01.local",
    port: 5174,
    strictPort: true,
    cors: {
      origin: "http://dev01.local",
      credentials: true,
    },
    hmr: {
      host: "dev01.local",
      protocol: "ws",
      port: 5174,
    },
  },

  build: {
    // FIXED: Drops the build exactly into the plugin root directory
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
    manifest: false,

    rollupOptions: {
      input: path.resolve(__dirname, "src/main.jsx"),
      output: {
        entryFileNames: 'main.js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'main.css';
          }
          return '[name][extname]';
        },
      },
    },
  },
});