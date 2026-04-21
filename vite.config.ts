import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import build from "@hono/vite-build/cloudflare-workers";
import devServer from "@hono/vite-dev-server";
import adapter from "@hono/vite-dev-server/cloudflare";
import { resolve } from "node:path";

const sharedAliases = {
  "@shared": resolve(__dirname, "src/shared"),
  "@worker": resolve(__dirname, "src/worker"),
  "@web": resolve(__dirname, "src/web"),
};

export default defineConfig(({ mode }) => {
  if (mode === "worker") {
    return {
      plugins: [
        build({
          entry: "./src/worker/index.ts",
          outputDir: "./dist/worker",
        }),
        devServer({
          adapter,
          entry: "./src/worker/index.ts",
        }),
      ],
      resolve: { alias: sharedAliases },
    };
  }

  return {
    plugins: [react(), tailwindcss()],
    root: "./src/web",
    publicDir: resolve(__dirname, "src/web/public"),
    build: {
      outDir: resolve(__dirname, "dist/client"),
      emptyOutDir: true,
      rollupOptions: {
        input: resolve(__dirname, "src/web/index.html"),
      },
    },
    resolve: { alias: sharedAliases },
    server: {
      port: 5173,
      proxy: {
        "/api": "http://localhost:8787",
      },
    },
  };
});
