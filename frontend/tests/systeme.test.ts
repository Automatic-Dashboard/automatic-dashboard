// La page Système et les services du réseau (Glances, Uptime Kuma, Speedtest…), essayés
// sur la maison famille à laquelle on ajoute une machine surveillée et deux services.
// Et le mode Complet sans étages : les pièces passent quand même en petit format.

import { describe, expect, it } from "vitest";
import type { EtatHA, HomeAssistant } from "../src/ha";
import { analyser } from "../src/moteur/analyser";
import { pointsARegarder } from "../src/moteur/points";
import type { CarteConfig, VueConfig } from "../src/strategie/configs";
import { genererTableau } from "../src/strategie/strategie";
import famille from "./fixtures/famille.json";

const AJOUTS: [string, string, string, Record<string, unknown>][] = [
  ["sensor.processeur", "systemmonitor", "12", { unit_of_measurement: "%", friendly_name: "Processeur" }],
  ["sensor.memoire", "systemmonitor", "41", { unit_of_measurement: "%", friendly_name: "Mémoire" }],
  ["sensor.debit_descendant", "speedtestdotnet", "312", { unit_of_measurement: "Mbit/s", device_class: "data_rate", friendly_name: "Débit descendant" }],
  ["sensor.site_familial", "uptime_kuma", "down", { device_class: "enum", friendly_name: "Site familial" }],
];

function maison(): HomeAssistant {
  const f = structuredClone(famille) as unknown as HomeAssistant;
  for (const [id, plateforme, etat, attributs] of AJOUTS) {
    f.entities[id] = { entity_id: id, platform: plateforme };
    f.states[id] = { entity_id: id, state: etat, attributes: attributs } as EtatHA;
  }
  return { ...f, locale: { language: "fr" }, user: { id: "essai", name: "Essai", is_admin: true }, callWS: async () => ({ entities: [] }) as any };
}
const cartes = (v: VueConfig): CarteConfig[] => v.sections.flatMap((s) => s.cards);
const titres = (v: VueConfig) => cartes(v).filter((c) => c.type === "heading").map((c) => c.heading);

describe("la page Système", () => {
  it("la machine d'abord, puis un groupe par service, au nom de son intégration", async () => {
    const t = await genererTableau({}, maison());
    const systeme = t.views.find((v) => v.path === "systeme")!;
    expect(titres(systeme)).toEqual(expect.arrayContaining(["La machine", "Speedtest", "Uptime Kuma"]));
    const groupeDe = (titre: string) => {
      const s = systeme.sections.find((x) => x.cards[0]?.heading === titre)!;
      return s.cards.slice(1).map((c) => c.entity);
    };
    expect(groupeDe("La machine")).toEqual(["sensor.processeur", "sensor.memoire"]);
    expect(groupeDe("Speedtest")).toEqual(["sensor.debit_descendant"]);
  });

  it("un service qui ne répond plus devient un point à regarder", () => {
    const h = maison();
    const points = pointsARegarder(h, analyser(h));
    expect(points.find((p) => p.entite === "sensor.site_familial")).toMatchObject({ niveau: 2, titre: "Service hors ligne" });
  });

  it("sans service du réseau, la page Système n'a pas de groupe vide", async () => {
    const h = { ...(structuredClone(famille) as unknown as HomeAssistant), locale: { language: "fr" }, callWS: async () => ({ entities: [] }) as any };
    const systeme = (await genererTableau({}, h)).views.find((v) => v.path === "systeme")!;
    for (const s of systeme.sections) expect(s.cards.length).toBeGreaterThan(s.cards[0]?.type === "heading" ? 1 : 0);
  });
});

describe("le mode Complet sans étages", () => {
  it("les pièces passent en petit format, trois par rangée", async () => {
    const t = await genererTableau({ type: "custom:automatic-dashboard", mode: "complet" }, maison());
    const largeurs = cartes(t.views[0]).filter((c) => c.type === "custom:automatic-dashboard-piece").map((c) => c.grid_options?.columns);
    // 7 pièces : une de 12, trois de 4, puis la dernière rangée élargie pour rester pleine sur ordinateur.
    expect(largeurs).toEqual([12, 4, 4, 4, 12, 6, 6]);
  });
});
