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
    rollupOptions: {
      output: {
        // Split heavy, rarely-changing vendor code out of the main bundle so
        // a route change or app-code edit doesn't force a re-download of
        // React/Radix/Recharts, and so the first paint isn't blocked on
        // chart code the dashboard route doesn't even use.
        manualChunks: {
          "vendor-react": ["react", "react-dom", "wouter"],
          "vendor-radix": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-toast",
            "@radix-ui/react-label",
            "@radix-ui/react-switch",
            "@radix-ui/react-slot",
          ],
          "vendor-charts": ["recharts"],
          "vendor-motion": ["framer-motion"],
        },
      },
    },
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
