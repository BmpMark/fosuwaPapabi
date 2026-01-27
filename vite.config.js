"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vite_1 = require("vite");
const plugin_react_1 = __importDefault(require("@vitejs/plugin-react"));
const path_1 = __importDefault(require("path"));
const vite_plugin_runtime_error_modal_1 = __importDefault(require("@replit/vite-plugin-runtime-error-modal"));
const vite_plugin_pwa_1 = require("vite-plugin-pwa");
exports.default = (0, vite_1.defineConfig)({
    plugins: [
        (0, plugin_react_1.default)(),
        (0, vite_plugin_runtime_error_modal_1.default)(),
        (0, vite_plugin_pwa_1.VitePWA)({
            registerType: "autoUpdate",
            includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
            manifest: {
                name: "Fosuwa Papabi Hotel",
                short_name: "Fosuwa Papabi",
                description: "Luxury hotel booking and management system with offline capabilities",
                theme_color: "#000000",
                background_color: "#ffffff",
                display: "standalone",
                orientation: "portrait-primary",
                scope: "/",
                start_url: "/",
                icons: [
                    {
                        src: "/icon-192x192.png",
                        sizes: "192x192",
                        type: "image/png",
                        purpose: "any maskable"
                    },
                    {
                        src: "/icon-512x512.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "any maskable"
                    }
                ],
                shortcuts: [
                    {
                        name: "Book a Room",
                        short_name: "Book Room",
                        description: "Quickly book a hotel room",
                        url: "/rooms",
                        icons: [{ src: "/icon-192x192.png", sizes: "192x192" }]
                    },
                    {
                        name: "My Reservations",
                        short_name: "Reservations",
                        description: "View your room bookings",
                        url: "/dashboard/reservations",
                        icons: [{ src: "/icon-192x192.png", sizes: "192x192" }]
                    },
                    {
                        name: "Room Service",
                        short_name: "Room Service",
                        description: "Order food and services",
                        url: "/restaurant",
                        icons: [{ src: "/icon-192x192.png", sizes: "192x192" }]
                    }
                ]
            },
            strategies: "injectManifest",
            srcDir: "src",
            filename: "sw.ts",
            devOptions: {
                enabled: false,
                type: "module"
            }
        }),
        ...(process.env.NODE_ENV !== "production" &&
            process.env.REPL_ID !== undefined
            ? [
                await Promise.resolve().then(() => __importStar(require("@replit/vite-plugin-cartographer"))).then((m) => m.cartographer()),
                await Promise.resolve().then(() => __importStar(require("@replit/vite-plugin-dev-banner"))).then((m) => m.devBanner()),
            ]
            : []),
    ],
    resolve: {
        alias: {
            "@": path_1.default.resolve(import.meta.dirname, "client", "src"),
            "@shared": path_1.default.resolve(import.meta.dirname, "shared"),
            "@assets": path_1.default.resolve(import.meta.dirname, "attached_assets"),
        },
    },
    root: path_1.default.resolve(import.meta.dirname, "client"),
    build: {
        outDir: path_1.default.resolve(import.meta.dirname, "dist/public"),
        emptyOutDir: true,
    },
    server: {
        fs: {
            strict: true,
            deny: ["**/.*"],
        },
    },
});
