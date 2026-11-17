// Les réglages de l'éditeur visuel : opérations sur la configuration, favoris épinglés
// puis complétés, entités masquées et noms affichés, essayés sur la maison famille.

import { describe, expect, it } from "vitest";
import { demasquer, deplacer, desepingler, epingler, masquer, nettoyer, renommer } from "../src/editeur/reglages";
import type { HomeAssistant, Instantane } from "../src/ha";
import { analyser } from "../src/moteur/analyser";
import { nomCourt } from "../src/outils";
import { choisirFavoris, nombreDeFavoris } from "../src/strategie/accueil";
import type { CarteConfig, VueConfig } from "../src/strategie/configs";
import { genererTableau, lireReglages } from "../src/strategie/strategie";
import debutant from "./fixtures/debutant.json";
import famille from "./fixtures/famille.json";

const TYPE = "custom:automatic-dashboard";

function hass(fixture: unknown, prediction: string[] = []): HomeAssistant {
  return {
    ...(fixture as HomeAssistant),
    user: { id: "essai", name: "Essai", is_admin: true },
    locale: { language: "fr" },
    callWS: async () => ({ entities: prediction }) as any,
  };
}
const cartes = (v: VueConfig): CarteConfig[] => [
  ...(v.sections ?? []).flatMap((s) => s.cards), ...(v.sidebar?.sections.flatMap((s) => s.cards) ?? []), ...(v.badges ?? []),
];
const favorisDe = (v: VueConfig): string[] => {
  const s = v.sections.find((x) => x.cards[0]?.type === "heading" && x.cards[0].heading === "Favoris");
  return (s?.cards.slice(1) ?? []).map((c) => String(c.entity));
};

describe("les opérations de l'éditeur", () => {
  it("une configuration sans réglage se réduit au type : le YAML reste lisible", () => {
    expect(nettoyer({ type: TYPE, mode: "auto", favoris: [], masquer: [], completer: true, noms: { "light.x": "  " } })).toEqual({ type: TYPE });
  });

  it("les doublons disparaissent, l'ordre reste celui de l'utilisateur", () => {
    expect(nettoyer({ type: TYPE, favoris: ["b", "a", "b"] }).favoris).toEqual(["b", "a"]);
    expect(nettoyer({ type: TYPE, completer: false }).completer).toBe(false);
  });

  it("glisser un favori le déplace, sans rien perdre", () => {
    expect(deplacer(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]);
    expect(deplacer(["a", "b", "c"], 0, 9)).toEqual(["b", "c", "a"]);
    expect(deplacer(["a", "b"], 5, 0)).toEqual(["a", "b"]);
  });

  it("épingler et masquer s'excluent", () => {
    const c = masquer({ type: TYPE, favoris: ["light.a", "light.b"] }, "light.a");
    expect(c).toEqual({ type: TYPE, favoris: ["light.b"], masquer: ["light.a"] });
    expect(epingler(c, "light.a")).toEqual({ type: TYPE, favoris: ["light.b", "light.a"] });
    expect(desepingler(epingler(c, "light.a"), "light.b").favoris).toEqual(["light.a"]);
    expect(demasquer(c, "light.a")).toEqual({ type: TYPE, favoris: ["light.b"] });
  });

  it("un nom vidé rend celui de Home Assistant", () => {
    const c = renommer({ type: TYPE }, "light.a", "Veilleuse");
    expect(c.noms).toEqual({ "light.a": "Veilleuse" });
    expect(renommer(c, "light.a", "")).toEqual({ type: TYPE });
  });

  it("du YAML tapé à la main mal formé est ignoré, pas une erreur", () => {
    const r = lireReglages({ type: TYPE, mode: "turbo" as any, favoris: "light.a" as any, masquer: ["light.b", 3 as any], noms: ["x"] as any });
    expect(r).toEqual({ mode: undefined, masquer: ["light.b"], favoris: undefined, completer: undefined, noms: undefined });
  });
});

describe("les favoris", () => {
  it("4 ou 8 pour des rangées pleines, tous les épinglés au-delà de 8", () => {
    expect(nombreDeFavoris(0, 10)).toBe(8);
    expect(nombreDeFavoris(0, 5)).toBe(4);
    expect(nombreDeFavoris(3, 10)).toBe(8);
    expect(nombreDeFavoris(3, 0)).toBe(4);
    expect(nombreDeFavoris(5, 1)).toBe(5);
    expect(nombreDeFavoris(10, 4)).toBe(10);
  });

  it("les épinglés d'abord, dans l'ordre choisi, puis les commandes habituelles", async () => {
    const h = hass(famille, ["light.kitchen_lights", "climate.ecobee", "light.office_rgbw_lights"]);
    const m = analyser(h);
    const f = await choisirFavoris(h, m, { favoris: ["climate.ecobee", "light.bed_light"] });
    expect(f.slice(0, 3)).toEqual(["climate.ecobee", "light.bed_light", "light.kitchen_lights"]);
    expect(f.filter((id) => id === "climate.ecobee")).toHaveLength(1);
    expect(f).toHaveLength(4);
  });

  it("sans compléter : seulement les épinglés", async () => {
    const h = hass(famille, ["light.kitchen_lights"]);
    expect(await choisirFavoris(h, analyser(h), { favoris: ["light.bed_light"], completer: false })).toEqual(["light.bed_light"]);
  });

  it("une entité masquée n'est jamais proposée", async () => {
    const h = hass(famille, ["light.ceiling_lights", "light.kitchen_lights"]);
    const reglages = { masquer: ["light.ceiling_lights"] };
    expect(await choisirFavoris(h, analyser(h, reglages), reglages)).not.toContain("light.ceiling_lights");
  });

  it("une entité épinglée qui n'existe plus est oubliée sans bruit", async () => {
    const h = hass(famille);
    expect(await choisirFavoris(h, analyser(h), { favoris: ["light.disparue", "light.bed_light"], completer: false })).toEqual(["light.bed_light"]);
  });
});

describe("les réglages dans le tableau", () => {
  const config = { type: TYPE, favoris: ["climate.ecobee", "light.bed_light"], masquer: ["light.ceiling_lights"], noms: { "light.bed_light": "Veilleuse" } };

  it("les favoris épinglés ouvrent la rangée des favoris", async () => {
    const t = await genererTableau(config, hass(famille));
    expect(favorisDe(t.views[0]).slice(0, 2)).toEqual(["climate.ecobee", "light.bed_light"]);
  });

  it("une entité masquée n'apparaît sur aucune page", async () => {
    const t = await genererTableau(config, hass(famille));
    for (const v of t.views) expect(cartes(v).map((c) => c.entity), v.path).not.toContain("light.ceiling_lights");
  });

  it("le nom choisi est posé sur les tuiles natives, sur toutes les pages", async () => {
    const t = await genererTableau(config, hass(famille));
    const tuiles = t.views.flatMap(cartes).filter((c) => c.entity === "light.bed_light");
    expect(tuiles.length).toBeGreaterThan(1);
    for (const c of tuiles) expect(c.name).toBe("Veilleuse");
  });

  it("un nom déjà donné par la stratégie n'est pas remplacé", async () => {
    const h = hass(famille);
    const meteo = analyser(h).meteo!;
    const t = await genererTableau({ type: TYPE, noms: { [meteo]: "Ciel" } }, h);
    expect(cartes(t.views[0]).find((c) => c.type === "weather-forecast")?.name).toBe("Appartement d'essai");
  });

  it("le mode forcé l'emporte sur la détection : en Complet, des tuiles compactes dans les pièces", async () => {
    const tuilesDuSalon = async (mode?: "complet") =>
      cartes((await genererTableau({ type: TYPE, mode }, hass(famille))).views.find((v) => v.path === "salon")!).filter((c) => c.type === "tile");
    expect((await tuilesDuSalon()).some((c) => c.features)).toBe(true);
    expect((await tuilesDuSalon("complet")).some((c) => c.features)).toBe(false);
  });

  it("en Découverte, pas de rangée de favoris, même avec des épinglés", async () => {
    const t = await genererTableau({ type: TYPE, favoris: ["light.essai_ampoule"] }, hass(debutant));
    expect(favorisDe(t.views[0])).toEqual([]);
  });
});

describe("les noms dans les cartes Automatic Dashboard", () => {
  it("le nom choisi passe avant celui de l'appareil, et les espaces autour sont retirés", () => {
    const h = hass(famille);
    const m = analyser(h as Instantane, { noms: { "light.bed_light": "  Veilleuse ", "light.kitchen_lights": "   " } });
    expect(m.noms).toEqual({ "light.bed_light": "Veilleuse" });
    expect(nomCourt(h, "light.bed_light", m.noms)).toBe("Veilleuse");
    expect(nomCourt(h, "light.kitchen_lights", m.noms)).not.toBe("");
  });
});

describe("les favoris proposés par Home Assistant", () => {
  it("ne gardent que ce qui se commande : ni la météo, ni un capteur", async () => {
    const { favorisAutomatiques } = await import("../src/strategie/accueil");
    const { analyser } = await import("../src/moteur/analyser");
    const h = structuredClone(famille) as any;
    const meteo = Object.keys(h.states).find((id: string) => id.startsWith("weather."))!;
    const lampe = Object.keys(h.states).find((id: string) => id.startsWith("light."))!;
    const capteur = Object.keys(h.entities).find((id: string) => id.startsWith("sensor.") && h.states[id])!;
    h.callWS = async () => ({ entities: [meteo, capteur, lampe] });
    expect(await favorisAutomatiques(h, analyser(h))).toEqual([lampe]);
  });
});

describe("quand la prédiction ne propose rien qui se commande", () => {
  it("une lumière par pièce de vie la remplace, plutôt qu'une rangée vide", async () => {
    const { favorisAutomatiques } = await import("../src/strategie/accueil");
    const { analyser } = await import("../src/moteur/analyser");
    const h = structuredClone(famille) as any;
    const meteo = Object.keys(h.states).find((id: string) => id.startsWith("weather."))!;
    h.callWS = async () => ({ entities: [meteo] });
    const favoris = await favorisAutomatiques(h, analyser(h));
    expect(favoris.length).toBeGreaterThan(0);
    expect(favoris.every((id: string) => /^(light|climate|water_heater|humidifier)\./.test(id))).toBe(true);
  });
});

