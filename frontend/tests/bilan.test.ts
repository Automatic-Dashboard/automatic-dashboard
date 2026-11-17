// Le bilan de la semaine : la bonne semaine, l'énergie jour par jour, les températures en
// plages et les ouvertures comptées.

import { describe, expect, it } from "vitest";
import { chargerBilan, compterOuvertures, moisPasse, resumerTemperatures, semainePassee, sommeParJour } from "../src/donnees/bilan";
import { lireReglagesEnergie, poserReglagesEnergie } from "../src/donnees/energie";
import { energiesMaison } from "../src/moteur/valeurs";
import type { HomeAssistant, Instantane } from "../src/ha";
import { analyser } from "../src/moteur/analyser";

describe("la semaine passée", () => {
  it.each([
    ["2026-11-17T15:00:00", "2026-11-09", "2026-11-16"], // un mardi
    ["2026-11-16T08:00:00", "2026-11-09", "2026-11-16"], // le lundi même : la semaine qui vient de finir
    ["2026-11-22T23:30:00", "2026-11-09", "2026-11-16"], // le dimanche soir : toujours la semaine d'avant
  ])("le %s → du %s au %s", (maintenant, debut, fin) => {
    const s = semainePassee(new Date(maintenant));
    const jour = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    expect([jour(s.debut), jour(s.fin), s.debut.getDay(), s.fin.getHours()]).toEqual([debut, fin, 1, 0]);
    expect(jour(s.avant)).toBe(jour(new Date(s.debut.getTime() - 7 * 86400000)));
  });
});

describe("les calculs", () => {
  const debut = new Date("2026-11-09T00:00:00");
  const jour = (i: number) => debut.getTime() + i * 86400000;

  it("additionne les compteurs jour par jour", () => {
    const stats = { "sensor.a": [{ start: jour(0), change: 4 }, { start: jour(2), change: 6 }], "sensor.b": [{ start: jour(0), change: 1.5 }] };
    expect(sommeParJour(stats, debut, 7)).toEqual([5.5, null, 6, null, null, null, null]);
  });

  it("accepte les secondes comme les millisecondes", () => {
    expect(sommeParJour({ x: [{ start: jour(1) / 1000, change: 2 }] }, debut, 3)).toEqual([null, 2, null]);
  });

  it("résume les températures : moyenne des moyennes, extrêmes", () => {
    const r = resumerTemperatures({ a: [{ mean: 20, min: 18, max: 22 }, { mean: 21, min: 19.5, max: 23 }], b: [{ mean: 19, min: 17, max: 20 }] });
    expect(r).toEqual({ moyenne: 20, min: 17, max: 23 });
    expect(resumerTemperatures({})).toBeNull();
  });

  it("compte les passages à « ouvert », pas l'état de départ", () => {
    const h = {
      "binary_sensor.porte": [{ s: "on" }, { s: "off" }, { s: "on" }, { s: "off" }, { s: "on" }],
      "binary_sensor.fenetre": [{ s: "off" }, { s: "on" }, { s: "unavailable" }, { s: "on" }],
      "binary_sensor.velux": [{ s: "off" }],
    };
    expect(compterOuvertures(h)).toEqual([["binary_sensor.porte", 2], ["binary_sensor.fenetre", 2]]);
  });
});

describe("le bilan complet", () => {
  it("assemble énergie, températures et ouvertures, et compare à la semaine d'avant", async () => {
    const { avant, debut } = semainePassee(new Date("2026-11-17T12:00:00"));
    const appels: string[] = [];
    const hass = {
      states: { "sensor.linky_energie": { entity_id: "sensor.linky_energie", state: "1", attributes: { device_class: "energy", unit_of_measurement: "kWh", friendly_name: "Linky énergie" } },
        "sensor.temp_salon": { entity_id: "sensor.temp_salon", state: "20", attributes: { device_class: "temperature", unit_of_measurement: "°C" } },
        "binary_sensor.porte": { entity_id: "binary_sensor.porte", state: "off", attributes: { device_class: "door" } } },
      entities: { "sensor.linky_energie": { entity_id: "sensor.linky_energie", platform: "linky" },
        "sensor.temp_salon": { entity_id: "sensor.temp_salon", platform: "zha", area_id: "salon" },
        "binary_sensor.porte": { entity_id: "binary_sensor.porte", platform: "zha", area_id: "salon" } },
      devices: {}, floors: {}, areas: { salon: { area_id: "salon", name: "Salon" } },
      config: { latitude: 0, longitude: 0 }, locale: { language: "fr" },
      callWS: async (msg: Record<string, any>) => {
        appels.push(msg.type);
        if (msg.type === "history/history_during_period") return { "binary_sensor.porte": [{ s: "off" }, { s: "on" }, { s: "off" }, { s: "on" }] };
        if (msg.types.includes("change")) {
          return { "sensor.linky_energie": Array.from({ length: 14 }, (_, i) => ({ start: avant.getTime() + i * 86400000, change: i < 7 ? 10 : 9 })) };
        }
        return { [msg.statistic_ids[0]]: [{ mean: 20, min: 19, max: 21 }] };
      },
    } as unknown as HomeAssistant;
    const b = await chargerBilan(hass, analyser(hass as Instantane), new Date("2026-11-17T12:00:00"));
    expect(b.debut).toEqual(debut);
    expect(b.energie).toEqual({ jours: [9, 9, 9, 9, 9, 9, 9], total: 63, precedent: 70, cout: null, coutPrecedent: null });
    expect(b.dedans).toEqual({ moyenne: 20, min: 19, max: 21 });
    expect(b.ouvertures).toEqual({ total: 2, parEntite: [["binary_sensor.porte", 2]] });
    expect(appels).toContain("history/history_during_period");
  });
});

describe("le mois passé", () => {
  it.each([
    ["2026-11-17T15:00:00", "2026-10-01", "2026-11-01", "2026-09-01"],
    ["2026-01-05T08:00:00", "2025-12-01", "2026-01-01", "2025-11-01"],
  ])("le %s → du %s au %s (avant : %s)", (maintenant, debut, fin, avant) => {
    const m = moisPasse(new Date(maintenant));
    const jour = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    expect([jour(m.debut), jour(m.fin), jour(m.avant)]).toEqual([debut, fin, avant]);
  });
});

describe("les réglages Énergie de Home Assistant", () => {
  const prefs = {
    energy_sources: [
      { type: "grid", flow_from: [{ stat_energy_from: "sensor.linky_hp", stat_cost: null }, { stat_energy_from: "sensor.linky_hc", stat_cost: "sensor.cout_hc" }],
        flow_to: [{ stat_energy_to: "sensor.revente" }] },
      { type: "solar", stat_energy_from: "sensor.panneaux" }, { type: "gas", stat_energy_from: "sensor.gaz" },
    ],
    device_consumption: [{ stat_consumption: "sensor.lave_linge_energie" }],
  };

  it("donnent les compteurs déclarés et leurs coûts (choisis, ou calculés par Home Assistant d'après le prix)", () => {
    expect(lireReglagesEnergie(prefs, { "sensor.linky_hp": "sensor.linky_hp_cost" })).toEqual({
      reseau: ["sensor.linky_hp", "sensor.linky_hc"], retour: ["sensor.revente"], solaire: ["sensor.panneaux"], gaz: ["sensor.gaz"], eau: [],
      couts: ["sensor.linky_hp_cost", "sensor.cout_hc"], appareils: ["sensor.lave_linge_energie"], puissance: [],
    });
    expect(lireReglagesEnergie({ energy_sources: [] })).toBeNull();
  });

  it("la forme de Home Assistant 2026 : une source réseau par compteur, avec prix, revente et puissance", () => {
    const r = lireReglagesEnergie({ energy_sources: [{ type: "grid", stat_energy_from: "sensor.linky", stat_energy_to: "sensor.revente",
      stat_cost: null, stat_rate: "sensor.linky_puissance" }] }, { "sensor.linky": "sensor.linky_cost" });
    expect(r).toMatchObject({ reseau: ["sensor.linky"], retour: ["sensor.revente"], couts: ["sensor.linky_cost"], puissance: ["sensor.linky_puissance"] });
  });

  it("l'emportent sur le compteur deviné d'après les noms", () => {
    const m = { energie: [], puissanceReseau: null } as any;
    poserReglagesEnergie(lireReglagesEnergie(prefs));
    expect(energiesMaison({ entities: {}, states: {} } as any, m)).toEqual(["sensor.linky_hp", "sensor.linky_hc"]);
    poserReglagesEnergie(null);
  });

  it("le bilan donne le coût, comparé à la période d'avant", async () => {
    poserReglagesEnergie({ reseau: ["sensor.linky"], retour: [], solaire: [], gaz: [], eau: [], couts: ["sensor.linky_cost"], appareils: [], puissance: [] });
    const { avant } = semainePassee(new Date("2026-11-17T12:00:00"));
    const hass = {
      states: {}, entities: {}, devices: {}, floors: {}, areas: {}, config: { latitude: 0, longitude: 0, currency: "EUR" }, locale: { language: "fr" },
      callWS: async (msg: Record<string, any>) => (msg.statistic_ids?.[0] === "sensor.linky_cost"
        ? { "sensor.linky_cost": Array.from({ length: 14 }, (_, i) => ({ start: avant.getTime() + i * 86400000, change: i < 7 ? 2 : 1.5 })) }
        : msg.statistic_ids?.[0] === "sensor.linky"
          ? { "sensor.linky": Array.from({ length: 14 }, (_, i) => ({ start: avant.getTime() + i * 86400000, change: 10 })) } : {}),
    } as unknown as HomeAssistant;
    const b = await chargerBilan(hass, analyser(hass as Instantane), new Date("2026-11-17T12:00:00"));
    expect(b.energie).toMatchObject({ total: 70, precedent: 70, cout: 10.5, coutPrecedent: 14 });
    poserReglagesEnergie(null);
  });
});
