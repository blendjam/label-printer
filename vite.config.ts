import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: false,
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,json,ttf,woff,woff2}"],
      },
      includeAssets: ["icon.svg"],
      manifest: {
        name: "Label Studio",
        short_name: "Labels",
        description: "Create precise two-up product labels.",
        theme_color: "#21443d",
        background_color: "#f7f5ef",
        display: "standalone",
        scope: "./",
        start_url: "./",
        icons: [
          {
            src: "icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
  base: "./",
});
