import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const dirname = path.dirname(fileURLToPath(import.meta.url));

// The API server defaults to port 4000 (see apps/api/src/index.ts). Override
// with API_PORT if you run it elsewhere.
const apiPort = process.env.API_PORT ?? "4000";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(dirname, "src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    port: Number(process.env.PORT ?? 5173),
    proxy: {
      "/api": {
        target: `http://localhost:${apiPort}`,
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: Number(process.env.PORT ?? 4173),
  },
});
