import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 9000,
    proxy: {
      "/api/health": {
        target: "http://localhost:9001",
        changeOrigin: true,
      },
      "/api/git": {
        target: "http://localhost:9001",
        changeOrigin: true,
      },
      "/api/data/versions": {
        target: "http://localhost:9001",
        changeOrigin: true,
      },
      "/api/data": {
        target: "http://localhost:9001",
        changeOrigin: true,
      },
    },
  },
});
