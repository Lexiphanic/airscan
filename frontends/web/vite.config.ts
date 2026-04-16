import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@airscan/types": path.resolve(__dirname, "../../packages/types/src"),
      "@airscan/engine": path.resolve(__dirname, "../../packages/engine/src"),
    },
  },
  base: process.env.NODE_ENV === "production" ? "/airscan/" : "/",
});
