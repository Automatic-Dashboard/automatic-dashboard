import { defineConfig } from "vite";

// Un seul fichier JavaScript, servi par l'intégration : custom_components/centralhome/frontend/centralhome.js
export default defineConfig({
  build: {
    lib: { entry: "src/index.ts", formats: ["es"], fileName: () => "centralhome.js" },
    outDir: "../custom_components/centralhome/frontend",
    emptyOutDir: false,
    target: "es2022",
    sourcemap: false,
    // Fichier lisible, non minifié : chacun peut relire ce qui tourne dans son navigateur
    // (40 Ko une fois compressé par Home Assistant).
    minify: false,
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
