// Les pages Air, Véhicule et Extérieur n'apparaissent que si la maison a de quoi les remplir.

import { describe, expect, it } from "vitest";
import type { HomeAssistant, Instantane } from "../src/ha";
import { analyser } from "../src/moteur/analyser";
import { pointsARegarder } from "../src/moteur/points";
import { genererTableau } from "../src/strategie/strategie";
import famille from "./fixtures/famille.json";

const maison = (modifier: (h: HomeAssistant) => void = () => {}) => {
  const h = { ...(structuredClone(famille) as unknown as HomeAssistant), locale: { language: "fr" },
    user: { id: "a", name: "A", is_admin: true }, callWS: async () => ({ entities: [] }) as any } as HomeAssistant;
  modifier(h);
  return h;
};
const ajouter = (h: HomeAssistant, id: string, state: string, attributes: Record<string, unknown>, entite: Record<string, unknown> = {}) => {
  h.states[id] = { entity_id: id, state, attributes, last_changed: new Date().toISOString() };
  h.entities[id] = { entity_id: id, platform: "template", labels: [], ...entite } as any;
};
const chemins = async (h: HomeAssistant) => (await genererTableau({}, h)).views.map((v) => v.path);

describe("la page Air", () => {
  it("apparaît avec un capteur de CO₂, avec sa pastille", async () => {
    const h = maison((x) => ajouter(x, "sensor.co2_bureau", "820", { device_class: "carbon_dioxide", unit_of_measurement: "ppm" }, { area_id: "bureau" }));
    expect(await chemins(h)).toContain("air");
    const accueil = (await genererTableau({}, h)).views[0];
    expect(accueil.badges.map((b) => b.sujet)).toContain("air");
  });
});

describe("la page Véhicule", () => {
  const voiture = (x: HomeAssistant, niveau: string) => {
    x.devices["zoe"] = { id: "zoe", name: "Zoé", area_id: null };
    ajouter(x, "sensor.zoe_batterie", niveau, { device_class: "battery", unit_of_measurement: "%" }, { platform: "renault", device_id: "zoe", name: "Batterie" });
    ajouter(x, "binary_sensor.zoe_charge", "off", { device_class: "battery_charging" }, { platform: "renault", device_id: "zoe", name: "Charge" });
  };

  it("apparaît pour une voiture, et sa batterie n'est pas une pile faible", async () => {
    const h = maison((x) => voiture(x, "15"));
    expect(await chemins(h)).toContain("vehicule");
    const m = analyser(h as Instantane);
    expect(m.piles.map((e) => e.id)).not.toContain("sensor.zoe_batterie");
    expect(pointsARegarder(h, m).some((p) => p.cle === "pile:sensor.zoe_batterie")).toBe(false);
  });

  it("la charge finie dans l'heure : « La voiture est chargée »", () => {
    const h = maison((x) => voiture(x, "92"));
    const p = pointsARegarder(h, analyser(h as Instantane)).find((x) => x.cle === "vehicule-charge");
    expect(p?.titre).toBe("La voiture est chargée");
  });
});

describe("la page Extérieur", () => {
  it("apparaît avec un portail, un arrosage et une tondeuse", async () => {
    const h = maison((x) => {
      ajouter(x, "cover.portail", "closed", { device_class: "gate" });
      ajouter(x, "valve.arrosage", "closed", {});
      ajouter(x, "lawn_mower.tondeuse", "docked", {});
    });
    expect(await chemins(h)).toContain("exterieur");
  });

  it("n'apparaît pas pour une maison sans extérieur", async () => {
    expect(await chemins(maison())).not.toContain("exterieur");
  });
});
