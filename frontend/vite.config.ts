import { readFileSync } from "node:fs";
import { defineConfig } from "vite";

const { version } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

// Un seul fichier JavaScript, servi par l'intégration : custom_components/automatic_dashboard/frontend/automatic-dashboard.js
export default defineConfig({
  // Un seul numéro de version : celui de package.json (le test Python le compare au manifeste).
  define: { __VERSION__: JSON.stringify(version) },
  build: {
    lib: { entry: "src/index.ts", formats: ["es"], fileName: () => "automatic-dashboard.js" },
    outDir: "../custom_components/automatic_dashboard/frontend",
    emptyOutDir: false,
    target: "es2022",
    sourcemap: false,
    // Fichier lisible, non minifié : chacun peut relire ce qui tourne dans son navigateur
    // (environ 55 Ko une fois compressé par Home Assistant).
    minify: false,
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
