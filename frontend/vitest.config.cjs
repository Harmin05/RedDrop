const { defineConfig } = require("vitest/config");
const path = require("node:path");

module.exports = defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.js"],
    include: ["src/**/*.{test,spec}.{js,jsx}"],
  },
  resolve: {
    alias: { "@": path.resolve("src") },
  },
});
