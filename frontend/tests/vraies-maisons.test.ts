// Ce que les premières vraies maisons ont appris au tri, sur une maison miniature qui reproduit
// chaque situation : restes d'intégrations supprimées, totaux par période, estimations PowerCalc,
// consommation « en veille », accessoires de caméra, télécommande d'un téléviseur.

import { describe, expect, it } from "vitest";
import type { HomeAssistant, Instantane } from "../src/ha";
import { analyser } from "../src/moteur/analyser";
import { pointsARegarder } from "../src/moteur/points";
import { variationJour } from "../src/donnees/historique";
import { phraseSujet } from "../src/phrases";
import { favorisAutomatiques } from "../src/strategie/accueil";

type Etat = { state: string; attributes?: Record<string, unknown> };

function maison(options: { demarrage?: boolean; compteur?: boolean } = {}): Instantane & { config: { state: string } } {
  const entites: [string, string, string | null, string | null, Etat][] = [
    // [entité, plateforme, appareil, pièce de l'entité, état]
    ["camera.cam", "tapo_control", "cam", null, { state: "idle" }],
    ["light.cam_projecteur", "tapo_control", "cam", null, { state: "off" }],
    ["switch.cam_prive", "tapo_control", "cam", null, { state: "off" }],
    ["siren.cam_sirene", "tapo_control", "cam", null, { state: "off" }],
    ["light.cam_projecteur_ancien", "tapo_control", "cam", null, { state: "unavailable", attributes: { restored: true } }],
    ["media_player.tv", "samsungtv", "tv", null, { state: "off" }],
    ["remote.tv", "samsungtv", "tv", null, { state: "off" }],
    ["light.led", "tuya", "led", null, { state: "on" }],
    ["light.lampe_sans_reseau", "tuya", "lampe", null, { state: "unavailable", attributes: { restored: true } }],
    ["sensor.lampe_power", "powercalc", "lampe", null, { state: "0", attributes: { device_class: "power", unit_of_measurement: "W" } }],
    ["sensor.led_power", "powercalc", "led", null, { state: "4.2", attributes: { device_class: "power", unit_of_measurement: "W" } }],
    ["sensor.led_energy", "powercalc", "led", null, { state: "1.3", attributes: { device_class: "energy", unit_of_measurement: "kWh" } }],
    ["sensor.led_energy_daily", "powercalc", "led", null,
      { state: "0.1", attributes: { device_class: "energy", unit_of_measurement: "kWh", status: "collecting", last_period: "0.2", next_reset: "2026-11-22T00:00:00+01:00" } }],
    ["sensor.prise_puissance", "meross_lan", "prise", null, { state: "116", attributes: { device_class: "power", unit_of_measurement: "W" } }],
    ["binary_sensor.porte", "homekit_controller", "aqara", null,
      { state: "unavailable", attributes: { device_class: "door", restored: true } }],
    ["media_player.vieille_enceinte", "cast", null, "salon", { state: "unavailable", attributes: { restored: true } }],
    ["sensor.all_standby_power", "powercalc", null, null, { state: "3.5", attributes: { device_class: "power", unit_of_measurement: "W" } }],
  ];
  if (options.compteur) {
    entites.push(["sensor.consommation_totale", "shelly", null, null,
      { state: "640", attributes: { device_class: "power", unit_of_measurement: "W", friendly_name: "Consommation totale" } }]);
  }
  const pieceDe: Record<string, string> = { cam: "chambre", tv: "salon", led: "chambre", lampe: "chambre", prise: "salle_de_bain", aqara: "salon" };
  return {
    config: { state: options.demarrage ? "STARTING" : "RUNNING" },
    areas: Object.fromEntries(["salon", "chambre", "salle_de_bain"].map((a) => [a, { area_id: a, name: a }])),
    floors: {},
    devices: Object.fromEntries(Object.entries(pieceDe).map(([id, piece]) => [id, { id, name: id, area_id: piece }])),
    entities: Object.fromEntries(entites.map(([id, platform, device, area]) => [id, { entity_id: id, platform, device_id: device, area_id: area }])),
    states: Object.fromEntries(entites.map(([id, , , , e]) => [id, { entity_id: id, state: e.state, attributes: { friendly_name: id, ...e.attributes } }])),
  } as unknown as Instantane & { config: { state: string } };
}

const entite = (m: ReturnType<typeof analyser>, id: string) => m.toutes.find((e) => e.id === id)!;

describe("les restes d'intégrations supprimées", () => {
  it("un doublon restauré d'un appareil vivant, ou une entité restaurée sans appareil, sont écartés", () => {
    const m = analyser(maison());
    expect(entite(m, "light.cam_projecteur_ancien").ecart).toBe("orpheline");
    expect(entite(m, "media_player.vieille_enceinte").ecart).toBe("orpheline");
  });

  it("un appareil entièrement restauré est hors ligne, pas orphelin : il reste, indisponible", () => {
    expect(entite(analyser(maison()), "binary_sensor.porte").ecart).toBeNull();
  });

  it("une intégration en panne, même si PowerCalc s'y greffe encore : l'appareil reste, indisponible", () => {
    expect(entite(analyser(maison()), "light.lampe_sans_reseau").ecart).toBeNull();
  });

  it("pendant le démarrage de Home Assistant, rien n'est orphelin", () => {
    const m = analyser(maison({ demarrage: true }));
    expect(entite(m, "light.cam_projecteur_ancien").ecart).toBeNull();
    expect(entite(m, "media_player.vieille_enceinte").ecart).toBeNull();
  });
});

describe("l'énergie, sans fausse puissance de la maison", () => {
  it("les totaux par jour, semaine ou mois d'un compteur sont écartés", () => {
    expect(entite(analyser(maison()), "sensor.led_energy_daily").ecart).toBe("total_periodique");
  });

  it("les estimations PowerCalc restent pour la page Énergie, mais pas dans les pièces", () => {
    const m = analyser(maison());
    expect(entite(m, "sensor.led_power")).toMatchObject({ role: "energie", secondaire: true });
    expect(entite(m, "sensor.prise_puissance")).toMatchObject({ role: "energie", secondaire: false });
  });

  it("ni une consommation en veille ni une estimation ne passent pour la puissance de la maison", () => {
    expect(analyser(maison()).puissanceReseau).toBeNull();
  });

  it("un vrai compteur de la maison est toujours choisi", () => {
    expect(analyser(maison({ compteur: true })).puissanceReseau).toBe("sensor.consommation_totale");
  });
});

describe("les accessoires passent au second plan", () => {
  it("projecteur, mode privé et sirène d'une caméra : secondaires ; la caméra reste au premier plan", () => {
    const m = analyser(maison());
    for (const id of ["light.cam_projecteur", "switch.cam_prive", "siren.cam_sirene"]) expect(entite(m, id).secondaire, id).toBe(true);
    expect(entite(m, "camera.cam").secondaire).toBe(false);
  });

  it("le projecteur d'une caméra n'est pas une lumière de la maison", () => {
    const ids = analyser(maison()).lumieres.map((e) => e.id);
    expect(ids).toContain("light.led");
    expect(ids).not.toContain("light.cam_projecteur");
  });

  it("la télécommande d'un téléviseur est secondaire, le téléviseur non", () => {
    const m = analyser(maison());
    expect(entite(m, "remote.tv").secondaire).toBe(true);
    expect(entite(m, "media_player.tv").secondaire).toBe(false);
  });
});

describe("les favoris", () => {
  it("jamais une entité indisponible, même si Home Assistant la propose", async () => {
    const instantane = maison();
    instantane.states["light.led"] = { ...instantane.states["light.led"], state: "unavailable" };
    const hass = { ...instantane, callWS: async () => ({ entities: ["light.led", "switch.cam_prive"] }) } as unknown as HomeAssistant;
    expect(await favorisAutomatiques(hass, analyser(instantane))).toEqual(["switch.cam_prive"]);
  });
});

describe("les appareils qui ne répondent plus", () => {
  const hass = (instantane: Instantane) => ({ ...instantane, locale: { language: "fr" }, callWS: async () => ({}) }) as unknown as HomeAssistant;

  it("un point les signale, avec leur nom : ici le pont Aqara et la lampe dont l'intégration est en panne", () => {
    const instantane = maison();
    const point = pointsARegarder(hass(instantane), analyser(instantane)).find((p) => p.cle.startsWith("hors-ligne:"))!;
    expect(point.titre).toBe("2 appareils ne répondent plus");
    expect(point.detail).toMatch(/^aqara, lampe\. Leur intégration/u);
  });

  it("un téléviseur éteint (indisponible, mais pas restauré) n'en est pas", () => {
    const instantane = maison();
    instantane.states["media_player.tv"] = { ...instantane.states["media_player.tv"], state: "unavailable" };
    instantane.states["remote.tv"] = { ...instantane.states["remote.tv"], state: "unavailable" };
    const point = pointsARegarder(hass(instantane), analyser(instantane)).find((p) => p.cle.startsWith("hors-ligne:"))!;
    expect(point.titre).toBe("2 appareils ne répondent plus");
  });
});

describe("l'énergie du jour", () => {
  it("est demandée en kWh : un compteur en Wh ne compte pas mille fois trop", async () => {
    const messages: Record<string, unknown>[] = [];
    const hass = { callWS: async (m: Record<string, unknown>) => { messages.push(m); return { change: m.statistic_id === "sensor.prise_wh" ? 0.651 : 0.04 }; } } as unknown as HomeAssistant;
    expect(await variationJour(hass, ["sensor.prise_wh", "sensor.lampe_kwh"], 0)).toBeCloseTo(0.691);
    expect(messages.every((m) => (m.units as { energy?: string } | undefined)?.energy === "kWh")).toBe(true);
  });
});

describe("la sécurité ne promet que ce qu'elle sait", () => {
  it("un capteur d'ouverture qui ne répond pas n'est pas « tout est fermé »", () => {
    const instantane = maison();
    const hass = { ...instantane, locale: { language: "fr" } } as unknown as HomeAssistant;
    expect(phraseSujet(hass, analyser(instantane), "securite").phrase).toBe("Le capteur d'ouverture ne répond pas.");
  });
});
