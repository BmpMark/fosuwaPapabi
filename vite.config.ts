// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";
// import path from "path";
// import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
// import { VitePWA } from "vite-plugin-pwa";

// export default defineConfig({
//   plugins: [
//     react(),
//     runtimeErrorOverlay(),
//     // VitePWA({
//     //   registerType: "autoUpdate",
//     //   includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
//     //   manifest: {
//     //     name: "Fosuwa Papabi Hotel",
//     //     short_name: "Fosuwa Papabi",
//     //     description: "Luxury hotel booking and management system with offline capabilities",
//     //     theme_color: "#000000",
//     //     background_color: "#ffffff",
//     //     display: "standalone",
//     //     orientation: "portrait-primary",
//     //     scope: "/",
//     //     start_url: "/",
//     //     icons: [
//     //       {
//     //         src: "/icon-192x192.png",
//     //         sizes: "192x192",
//     //         type: "image/png",
//     //         purpose: "any maskable"
//     //       },
//     //       {
//     //         src: "/icon-512x512.png",
//     //         sizes: "512x512",
//     //         type: "image/png",
//     //         purpose: "any maskable"
//     //       }
//     //     ],
//     //     shortcuts: [
//     //       {
//     //         name: "Book a Room",
//     //         short_name: "Book Room",
//     //         description: "Quickly book a hotel room",
//     //         url: "/rooms",
//     //         icons: [{ src: "/icon-192x192.png", sizes: "192x192" }]
//     //       },
//     //       {
//     //         name: "My Reservations",
//     //         short_name: "Reservations",
//     //         description: "View your room bookings",
//     //         url: "/dashboard/reservations",
//     //         icons: [{ src: "/icon-192x192.png", sizes: "192x192" }]
//     //       },
//     //       {
//     //         name: "Room Service",
//     //         short_name: "Room Service",
//     //         description: "Order food and services",
//     //         url: "/restaurant",
//     //         icons: [{ src: "/icon-192x192.png", sizes: "192x192" }]
//     //       }
//     //     ]
//     //   },
//     //   strategies: "injectManifest",
//     //   srcDir: "src",
//     //   filename: "sw.ts",
//     //   devOptions: {
//     //     enabled: false,
//     //     type: "module"
//     //   }
//     // }),
//     ...(process.env.NODE_ENV !== "production" &&
//     process.env.REPL_ID !== undefined
//       ? [
//           await import("@replit/vite-plugin-cartographer").then((m) =>
//             m.cartographer(),
//           ),
//           await import("@replit/vite-plugin-dev-banner").then((m) =>
//             m.devBanner(),
//           ),
//         ]
//       : []),
//   ],
//   resolve: {
//     alias: {
//       "@": path.resolve(import.meta.dirname, "client", "src"),
//       "@shared": path.resolve(import.meta.dirname, "shared"),
//       "@assets": path.resolve(import.meta.dirname, "attached_assets"),
//     },
//   },
//   root: path.resolve(import.meta.dirname, "client"),
//   build: {
//     outDir: path.resolve(import.meta.dirname, "dist/public"),
//     emptyOutDir: true,
//   },
//   server: {
//     fs: {
//       strict: true,
//       deny: ["**/.*"],
//     },
//   },
// });

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "server/public"), // <-- output directly where server expects it
    emptyOutDir: true,
  },  
});



