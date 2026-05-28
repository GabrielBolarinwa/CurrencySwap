import { VitePWA } from "vite-plugin-pwa";

export default {
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "CurrencySwap",
        short_name: "CurrencySwap",
        icons: [
          { src: "/192.png", sizes: "192x192", type: "image/png" },
          { src: "/512.png", sizes: "512x512", type: "image/png" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,ico}"],
      },
    }),
  ],
};
