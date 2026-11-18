// La démo interactive du site : le vrai tableau, sur une maison fictive, dans une page web.
// Un seul fichier, minifié, avec seulement les icônes utilisées et les couleurs du thème
// Automatic Dashboard lues dans custom_components/automatic_dashboard/themes/.
//
//   npm run demo   →   dist-demo/automatic-dashboard-demo.js, à copier dans le site
//                      (npm run demo dans le dépôt du site s'en charge).

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import * as mdi from "@mdi/js";
import { defineConfig, type Plugin } from "vite";

const { version } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));
const ici = new URL(".", import.meta.url).pathname;

/** Les fichiers dont on lit les noms d'icônes : le code du tableau et la maison de la démo. */
function sources(dossier: string): string[] {
  return readdirSync(dossier).flatMap((n) => {
    const p = join(dossier, n);
    return statSync(p).isDirectory() ? sources(p) : /\.(ts|json)$/.test(n) ? [p] : [];
  });
}

/** Les icônes « mdi:… » citées quelque part, avec leur tracé. */
function icones(): Plugin {
  const id = "virtual:icones-demo";
  return {
    name: "icones-demo",
    resolveId: (s) => (s === id ? `\0${id}` : undefined),
    load(s) {
      if (s !== `\0${id}`) return undefined;
      const fichiers = [...sources(join(ici, "src")), join(ici, "tests/fixtures/famille.json")];
      const noms = new Set(fichiers.flatMap((f) => readFileSync(f, "utf8").match(/mdi:[a-z0-9-]+/g) ?? []));
      const traces: Record<string, string> = {};
      for (const nom of noms) {
        const cle = `mdi${nom.slice(4).split("-").map((m) => m.charAt(0).toUpperCase() + m.slice(1)).join("")}`;
        const trace = (mdi as Record<string, string>)[cle];
        if (trace) traces[nom] = trace;
      }
      return `export default ${JSON.stringify(traces)};`;
    },
  };
}

/** Les variables CSS du thème Automatic Dashboard, en clair et en sombre. */
function theme(): Plugin {
  const id = "virtual:theme-demo";
  return {
    name: "theme-demo",
    resolveId: (s) => (s === id ? `\0${id}` : undefined),
    load(s) {
      if (s !== `\0${id}`) return undefined;
      const lignes = readFileSync(join(ici, "../custom_components/automatic_dashboard/themes/automatic_dashboard.yaml"), "utf8").split("\n");
      const variables: Record<"commun" | "light" | "dark", string[]> = { commun: [], light: [], dark: [] };
      let dansTheme = false;
      let mode: "light" | "dark" = "light";
      for (let i = 0; i < lignes.length; i++) {
        const ligne = lignes[i];
        if (/^\S/.test(ligne)) {
          // Le premier thème du fichier, « Automatic Dashboard » ; ses variantes suivent.
          dansTheme = ligne.startsWith("Automatic Dashboard:");
          continue;
        }
        const m = /^( +)([a-z0-9_-]+):\s*(.*?)\s*$/.exec(ligne);
        if (!dansTheme || !m) continue;
        const [, retrait, cle] = m;
        let valeur = m[3];
        if (retrait.length === 4 && (cle === "light" || cle === "dark")) {
          mode = cle;
          continue;
        }
        if (!valeur || cle === "modes") continue;
        // Une valeur sur plusieurs lignes (« >- ») : les lignes suivantes, plus en retrait.
        if (valeur === ">-" || valeur === "|") {
          const suite: string[] = [];
          while (i + 1 < lignes.length && /^\s*$|^ {8,}/.test(lignes[i + 1]) && lignes[i + 1].search(/\S/) > retrait.length) suite.push(lignes[++i].trim());
          valeur = suite.join(" ");
        }
        valeur = valeur.startsWith('"') ? valeur.slice(1, valeur.lastIndexOf('"')) : valeur.replace(/\s+#.*$/, "");
        variables[retrait.length === 2 ? "commun" : mode].push(`--${cle}:${valeur}`);
      }
      const css = `.ad-demo{${[...variables.commun, ...variables.light].join(";")}}`
        + `@media (prefers-color-scheme: dark){.ad-demo{${variables.dark.join(";")}}}`;
      return `export default ${JSON.stringify(css)};`;
    },
  };
}

export default defineConfig({
  define: { __VERSION__: JSON.stringify(version) },
  plugins: [icones(), theme()],
  build: {
    lib: { entry: "src/demo/index.ts", formats: ["es"], fileName: () => "automatic-dashboard-demo.js" },
    outDir: "dist-demo",
    emptyOutDir: true,
    target: "es2022",
    sourcemap: false,
    minify: true,
  },
});
