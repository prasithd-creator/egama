import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    svgr()
  ],
  server: {
    proxy: {
      "/api": {
        target: "https://class-announced-fuzzy-televisions.trycloudflare.com",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, "")
      }
    }
  }
});