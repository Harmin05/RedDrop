const { defineConfig } = require("vite");
const path = require("node:path");

// https://vitejs.dev/config/
module.exports = defineConfig(() => ({
  server: {
    host: "::",
    port: Number(process.env.VITE_PORT) || 5173,
    strictPort: true,
    hmr: {
      overlay: false,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve("src"),
    },
  },
}));
