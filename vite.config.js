import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  base: './',

  server: {
    // Change this to match your actual LocalWP site domain
    host: "dev01.local",
    port: 5174,
    strictPort: true,
    cors: {
      origin: "http://dev01.local", // Match the protocol and domain
      credentials: true,
    },
    hmr: {
      host: "dev01.local",
      protocol: "ws",
      port: 5174,
    },
  },

  build: {
    // UPDATED: Shoots the build up two levels into a root 'dist' folder!
    outDir: path.resolve(__dirname, "../../dist"),
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