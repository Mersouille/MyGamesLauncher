import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  base: "./", // indispensable pour les builds Electron

  // Configuration du serveur de développement
  server: {
    port: 5174,
    strictPort: true,
    headers: {
      // Autorise explicitement le préchargement
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
    cors: {
      origin: "*",
      methods: ["GET"],
    },
    hmr: {
      protocol: "ws",
      host: "localhost",
      port: 5174,
    },
  },

  build: {
    outDir: "dist-react",
    // 🔒 DÉSACTIVER modulePreload pour éviter les data: URIs bloquées par CSP
    modulePreload: false,
    // Optimisations pour Electron
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Groupe les node_modules dans un chunk séparé
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
    },
  },

  // Configuration optimisée pour Electron + React
  optimizeDeps: {
    exclude: ["electron", "path", "fs"],
    // Force le préchargement de React et dépendances communes
    include: ["react", "react-dom", "react/jsx-runtime"],
    // Désactive les warnings de préchargement pour certains modules
    force: true,
  },

  // Résolution des modules
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
