// Les langues : chacune a exactement les clés du français, chaque phrase se construit sans
// erreur, une langue non traduite retombe sur l'anglais, et aucune phrase n'est écrite en dur
// dans le code (elle échapperait aux traducteurs).

import { describe, expect, it } from "vitest";
import type { HomeAssistant } from "../src/ha";
import { en } from "../src/langues/en";
import { fr } from "../src/langues/fr";
import { langueDe, t } from "../src/outils";
import { LANGUES } from "../src/textes";

/** La forme d'une langue : chaque clé, avec « fonction », « liste(n) » ou « texte ». */
function forme(v: unknown, chemin = ""): string[] {
  if (typeof v === "function") return [`${chemin} fonction`];
  if (Array.isArray(v)) return [`${chemin} liste(${v.length})`, ...v.flatMap((x, i) => forme(x, `${chemin}[${i}]`))];
  if (v && typeof v === "object") return Object.keys(v).sort().flatMap((k) => forme((v as Record<string, unknown>)[k], `${chemin}.${k}`));
  return [`${chemin} texte`];
}

/** Les tables dont les clés dépendent de la langue : noms traduits seulement quand ils diffèrent, valeurs de Météo-France. */
const LIBRES = [".meteo.", ".integrations.", ".textes.pluieTypes."];

describe("chaque langue a les clés du français", () => {
  for (const [code, langue] of Object.entries(LANGUES)) {
    it(code, () => {
      const garder = (l: string) => !LIBRES.some((p) => l.startsWith(p));
      expect(forme(langue).filter(garder)).toEqual(forme(fr).filter(garder));
      expect(Object.keys(langue.meteo).sort()).toEqual(Object.keys(fr.meteo).sort());
    });
  }
});

describe("chaque phrase se construit", () => {
  const essayer = (v: unknown, chemin: string): void => {
    if (typeof v === "function") {
      // Les paramètres ne sont pas connus à l'exécution : au moins une série doit donner une phrase.
      const series = [[1, 2, 3], [2, 5, 7], ["Salon", "Cuisine", "x"], [["Salon", "Cuisine"], 2, "x"], ["Salon", 2, 3, 4], [2, "Salon", "x"]];
      const phrases = series.flatMap((args) => {
        try {
          const r = (v as (...a: unknown[]) => unknown)(...args);
          return typeof r === "string" && r.length && !r.includes("undefined") ? [r] : [];
        } catch {
          return [];
        }
      });
      expect(phrases.length, chemin).toBeGreaterThan(0);
    } else if (v && typeof v === "object") {
      for (const [k, x] of Object.entries(v)) essayer(x, `${chemin}.${k}`);
    }
  };
  for (const [code, langue] of Object.entries(LANGUES)) it(code, () => essayer(langue, code));
});

describe("la langue de l'utilisateur", () => {
  const hass = (language: string) => ({ locale: { language } }) as unknown as HomeAssistant;
  it("français et anglais", () => {
    expect(langueDe(hass("fr"))).toBe(fr);
    expect(langueDe(hass("en-GB"))).toBe(en);
  });
  it("une langue non traduite retombe sur l'anglais", () => {
    expect(langueDe(hass("de"))).toBe(en);
    expect(t(hass("es")).accueil).toBe(en.textes.accueil);
  });
});

describe("aucune phrase en dur dans le code", () => {
  // Les sources, lues telles quelles par Vite ; les fichiers de langue sont exclus.
  const sources = import.meta.glob<string>(["../src/**/*.ts", "!../src/langues/**"], { query: "?raw", import: "default", eager: true });
  // « fr ? "texte" : … » ou « estFrancais(hass) ? `texte` : … » : une phrase qui échapperait aux fichiers de langue.
  const motif = /(?:\bfr|estFrancais\([^)]*\))\s*\?\s*["`]/u;
  it("les textes passent par les fichiers de langue", () => {
    expect(Object.keys(sources).length).toBeGreaterThan(30);
    const fautifs = Object.entries(sources).flatMap(([f, texte]) =>
      texte.split("\n").flatMap((l, i) => (motif.test(l) ? [`${f.replace("../src/", "")}:${i + 1}`] : [])));
    expect(fautifs).toEqual([]);
  });
});
