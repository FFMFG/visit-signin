import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@shared": resolve(__dirname, "src/shared"),
      "@worker": resolve(__dirname, "src/worker"),
    },
  },
});
