import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "dev01.local",
    port: 5173,
    strictPort: true,

    // ✅ allow WP admin to load module scripts from :5173
    cors: {
      origin: "http://dev01.local",
      credentials: true,
    },

    // (optional but helps WP admin + HMR stability on some setups)
    hmr: {
      host: "dev01.local",
      protocol: "ws",
      port: 5173,
    },
    build: {
      outDir: path.resolve(__dirname, "../../build/admin-app"),
      emptyOutDir: true,
      manifest: true,
      rollupOptions: {
        input: path.resolve(__dirname, "index.html"),
      },
    },
  },
});
