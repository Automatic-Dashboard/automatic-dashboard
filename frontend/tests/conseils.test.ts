// Les conseils : deux faits qui se croisent, ou une mesure au-delà du bon sens.

import { describe, expect, it } from "vitest";
import type { HomeAssistant, Instantane } from "../src/ha";
import { analyser } from "../src/moteur/analyser";
import { avecArticle, chauffe } from "../src/moteur/conseils";
import { pointsARegarder } from "../src/moteur/points";
import famille from "./fixtures/famille.json";

const maison = (modifier: (h: HomeAssistant) => void) => {
  const h = { ...(structuredClone(famille) as unknown as HomeAssistant), locale: { language: "fr" } } as HomeAssistant;
  const m0 = analyser(h as Instantane);
  modifier(h);
  return { h, m: analyser(h as Instantane), m0 };
};

describe("l'article devant un nom de pièce ou d'ouverture", () => {
  it.each([
    ["Chambre de Léa", true, "la chambre de Léa"],
    ["Salon", true, "le salon"],
    ["Entrée", true, "l'entrée"],
    ["Fenêtre de la chambre", true, "la fenêtre de la chambre"],
    ["Salle de bain", true, "la salle de bain"],
    ["Chez Léa", true, null],
    ["Bedroom", false, "the bedroom"],
    ["Léa's room", false, null],
  ])("%s → %s", (nom, fr, attendu) => {
    expect(avecArticle(nom, fr as boolean)).toBe(attendu);
  });
});

describe("le chauffage tourne-t-il ?", () => {
  it.each([
    [{ state: "heat", attributes: { hvac_action: "heating" } }, true],
    [{ state: "heat", attributes: { hvac_action: "idle" } }, false], // consigne atteinte
    [{ state: "heat", attributes: {} }, true],
    [{ state: "cool", attributes: {} }, false],
    [{ state: "off", attributes: { hvac_action: "heating" } }, false],
  ])("%j → %s", (etat, attendu) => {
    expect(chauffe(etat)).toBe(attendu);
  });
});

describe("fenêtre ouverte et chauffage", () => {
  it("dans la même pièce : un conseil remplace le constat", () => {
    const { h, m } = maison((x) => {
      const m0 = analyser(x as Instantane);
      const fenetre = m0.ouvrants.find((o) => o.piece)!;
      x.states[fenetre.id].state = "on";
      const clim = m0.climats.find((c) => c.domaine === "climate")!;
      x.entities[clim.id].area_id = fenetre.piece;
      x.states[clim.id] = { ...x.states[clim.id], state: "heat", attributes: { ...x.states[clim.id].attributes, hvac_action: "heating" } };
    });
    const fenetre = m.ouvrants.find((o) => o.piece)!;
    const lies = pointsARegarder(h, m).filter((p) => p.entite === fenetre.id);
    expect(lies).toHaveLength(1);
    expect(lies[0]).toMatchObject({ conseil: true, niveau: 2, cle: `ouvrant:${fenetre.id}` });
    expect(lies[0].titre).toMatch(/^Fermez la fenêtre/);
    expect(lies[0].detail).toBe("Le chauffage tourne pendant que c'est ouvert.");
  });

  it("chauffage éteint : le simple constat reste", () => {
    const { h, m } = maison((x) => {
      const m0 = analyser(x as Instantane);
      x.states[m0.ouvrants[0].id].state = "on";
      for (const c of m0.climats) x.states[c.id] = { ...x.states[c.id], state: "off" };
    });
    const p = pointsARegarder(h, m).find((x) => x.entite === m.ouvrants[0].id)!;
    expect(p.conseil).toBeUndefined();
  });
});

describe("l'air des pièces", () => {
  const avecMesure = (classe: string, unite: string, valeur: string) => maison((x) => {
    const piece = Object.values(x.areas).find((a) => a.name === "Chambre")!;
    x.states["sensor.essai_air"] = { entity_id: "sensor.essai_air", state: valeur,
      attributes: { device_class: classe, unit_of_measurement: unite, friendly_name: "Air chambre" } };
    x.entities["sensor.essai_air"] = { entity_id: "sensor.essai_air", platform: "template", area_id: piece.area_id, labels: [] };
  });

  it("1 400 ppm de CO₂ : « Aérez la chambre »", () => {
    const { h, m } = avecMesure("carbon_dioxide", "ppm", "1400");
    const p = pointsARegarder(h, m).find((x) => x.cle.startsWith("air:"))!;
    expect(p).toMatchObject({ titre: "Aérez la chambre", niveau: 1, conseil: true, entite: "sensor.essai_air" });
    expect(p.detail).toMatch(/^1\s?400 ppm de CO₂/u);
  });

  it("au-delà de 1 500 ppm, le conseil devient pressant", () => {
    const { h, m } = avecMesure("carbon_dioxide", "ppm", "1800");
    expect(pointsARegarder(h, m).find((x) => x.cle.startsWith("air:"))!.niveau).toBe(2);
  });

  it("800 ppm : rien à dire", () => {
    const { h, m } = avecMesure("carbon_dioxide", "ppm", "800");
    expect(pointsARegarder(h, m).some((x) => x.cle.startsWith("air:"))).toBe(false);
  });

  it("85 % d'humidité : aérer contre la moisissure", () => {
    const { h, m } = avecMesure("humidity", "%", "85");
    expect(pointsARegarder(h, m).find((x) => x.cle.startsWith("air:"))!.detail).toMatch(/85 % d'humidité/u);
  });
});
