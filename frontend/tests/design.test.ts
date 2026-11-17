// Les corrections de design : heures à la française, ce qui est « en marche », la page
// Climat sans répétition, et les choix d'affichage lus et nettoyés.

import { describe, expect, it } from "vitest";
import { nettoyer } from "../src/editeur/reglages";
import type { HomeAssistant, Instantane } from "../src/ha";
import { analyser } from "../src/moteur/analyser";
import { enMarcheClimat } from "../src/moteur/valeurs";
import { heure } from "../src/outils";
import type { CarteConfig } from "../src/strategie/configs";
import { genererTableau, lireReglages } from "../src/strategie/strategie";
import famille from "./fixtures/famille.json";

const hass = (langue = "fr") => ({
  ...(structuredClone(famille) as unknown as HomeAssistant), locale: { language: langue },
  user: { id: "a", name: "A", is_admin: true }, callWS: async () => ({ entities: [] }) as any,
}) as HomeAssistant;

describe("les heures", () => {
  it("à la française : 7 h 34, 17 h 05", () => {
    expect(heure(hass(), new Date("2026-11-17T07:34:00"))).toBe("7 h 34");
    expect(heure(hass(), new Date("2026-11-17T17:05:00"))).toBe("17 h 05");
  });
  it("en anglais, selon la langue", () => {
    expect(heure(hass("en"), new Date("2026-11-17T17:05:00"))).toMatch(/^5:05\s?PM$/u);
  });
});

describe("ce qui est en marche", () => {
  it("dit quoi : chauffages, clims, autres", () => {
    const h = hass();
    const texte = enMarcheClimat(h, analyser(h as Instantane));
    expect(texte).toMatch(/en marche$/);
    expect(texte).toMatch(/chauffage|clim|appareil/);
    expect(texte).not.toMatch(/^\d+ en marche$/);
  });
});

describe("la page Climat", () => {
  const climat = async (config: Record<string, unknown>) => (await genererTableau(config, hass())).views.find((v) => v.path === "climat")!;
  const types = (v: Awaited<ReturnType<typeof climat>>) => v.sections.flatMap((s) => s.cards.map((c: CarteConfig) => c.type));

  it("montre les pièces une seule fois, en barres par défaut, sans pastilles en double", async () => {
    const v = await climat({});
    expect(types(v)).toContain("custom:automatic-dashboard-confort");
    expect(types(v)).not.toContain("custom:automatic-dashboard-plan");
    expect(v.badges).toEqual([]);
  });

  it("ou en mosaïque, si on la choisit", async () => {
    const v = await climat({ pieces: "mosaique" });
    expect(types(v)).toContain("custom:automatic-dashboard-plan");
    expect(types(v)).not.toContain("custom:automatic-dashboard-confort");
  });

  it("la carte météo porte le nom de la maison, pas celui de l'intégration", async () => {
    const v = await climat({});
    const meteo = v.sections.flatMap((s) => s.cards).find((c: CarteConfig) => c.type === "weather-forecast");
    expect(meteo?.name).toBe(hass().config.location_name);
  });

  it("aucune carte native ne garde son propre titre : un titre de section le remplace", async () => {
    const t = await genererTableau({}, hass());
    const titres = t.views.flatMap((v) => [...(v.sections ?? []), ...(v.sidebar?.sections ?? [])]).flatMap((s) => s.cards)
      .filter((c: CarteConfig) => ["statistics-graph", "history-graph", "distribution", "logbook"].includes(String(c.type)) && c.title);
    expect(titres).toEqual([]);
  });
});

describe("les choix d'affichage", () => {
  it("se lisent en ignorant ce qui n'a pas la bonne forme", () => {
    expect(lireReglages({ style: "doux", pieces: "mosaique", ciel: false, tablette: { debut_nuit: 22, fin_nuit: 99, reveil: "x" } } as any))
      .toMatchObject({ style: "doux", pieces: "mosaique", ciel: false, tablette: { debut_nuit: 22, fin_nuit: undefined, reveil: undefined } });
    expect(lireReglages({ style: "fluo", pieces: "camembert" } as any)).toMatchObject({ style: undefined, pieces: undefined });
  });

  it("le YAML ne garde que ce qui s'écarte du défaut", () => {
    expect(nettoyer({ style: "automatic", pieces: "barres", ciel: true, tablette: { debut_nuit: 23, fin_nuit: 6 } })).toEqual({});
    expect(nettoyer({ style: "contraste", ciel: false, tablette: { debut_nuit: 22 } })).toEqual({ style: "contraste", ciel: false, tablette: { debut_nuit: 22 } });
  });
});

describe("le style et les tuiles", () => {
  it.each([
    [{}, "Automatic Dashboard"], [{ style: "doux" }, "Automatic Dashboard Soft"], [{ style: "contraste" }, "Automatic Dashboard Contrast"],
  ])("%j → thème %s sur chaque page", async (config, theme) => {
    const t = await genererTableau(config as any, hass());
    expect(new Set(t.views.map((v) => v.theme))).toEqual(new Set([theme]));
  });

  it("« Votre thème » : aucune page n'impose de thème", async () => {
    const t = await genererTableau({ style: "home_assistant" } as any, hass());
    expect(t.views.every((v) => !("theme" in v))).toBe(true);
  });

  it("les favoris en tuiles Automatic Dashboard par défaut, natives si on le choisit", async () => {
    const favoris = async (config: Record<string, unknown>) => (await genererTableau({ favoris: ["light.bed_light"], ...config } as any, hass())).views[0]
      .sections.find((s) => s.cards[0]?.heading === "Favoris")!.cards.slice(1).map((c: CarteConfig) => c.type);
    expect(new Set(await favoris({}))).toEqual(new Set(["custom:automatic-dashboard-favori"]));
    expect(new Set(await favoris({ tuiles: "home_assistant" }))).toEqual(new Set(["tile"]));
  });
});
