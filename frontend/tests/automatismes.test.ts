// « Me prévenir » : l'automatisme tout fait couvre tous les capteurs du même genre et
// prévient les téléphones de l'application Home Assistant.

import { describe, expect, it } from "vitest";
import type { HomeAssistant, Instantane } from "../src/ha";
import { analyser } from "../src/moteur/analyser";
import { automatisme, automatismeExiste, destinatairesDe, telephones } from "../src/moteur/automatismes";
import { pointsARegarder } from "../src/moteur/points";
import famille from "./fixtures/famille.json";

const maison = (modifier: (h: HomeAssistant) => void = () => {}) => {
  const h = {
    ...(structuredClone(famille) as unknown as HomeAssistant), locale: { language: "fr" }, user: { id: "a", name: "A", is_admin: true },
    services: { notify: { mobile_app_pixel: {}, mobile_app_ipad: {}, notify: {} }, persistent_notification: { create: {} } },
  } as HomeAssistant;
  modifier(h);
  return { h, m: analyser(h as Instantane) };
};
const fuite = (h: HomeAssistant) => {
  h.states["binary_sensor.fuite_cuisine"] = { entity_id: "binary_sensor.fuite_cuisine", state: "on",
    attributes: { device_class: "moisture", friendly_name: "Fuite cuisine" } };
  h.entities["binary_sensor.fuite_cuisine"] = { entity_id: "binary_sensor.fuite_cuisine", platform: "zha", area_id: "cuisine", labels: [] };
};

describe("l'automatisme d'une fuite", () => {
  it("surveille tous les détecteurs de fuite et prévient chaque téléphone", () => {
    const { h, m } = maison(fuite);
    const a = automatisme(h, m, "fuite")!;
    expect(a.id).toBe("automatic_dashboard_fuite");
    expect(a.config).toMatchObject({ alias: "Automatic Dashboard : prévenir en cas de fuite", mode: "queued" });
    const [declencheur] = a.config.triggers as { trigger: string; entity_id: string[]; to: string }[];
    expect(declencheur).toMatchObject({ trigger: "state", from: "off", to: "on" });
    expect(declencheur.entity_id).toEqual(m.alertes.filter((e) => e.classe === "moisture").map((e) => e.id));
    expect(declencheur.entity_id).toContain("binary_sensor.fuite_cuisine");
    const actions = (a.config.actions as { action: string }[]).map((x) => x.action);
    expect(actions).toEqual(["persistent_notification.create", "notify.mobile_app_ipad", "notify.mobile_app_pixel"]);
  });

  it("le point « Fuite détectée » propose de prévenir", () => {
    const { h, m } = maison(fuite);
    expect(pointsARegarder(h, m).find((p) => p.entite === "binary_sensor.fuite_cuisine")?.prevenir).toBe("fuite");
  });

  it("sans détecteur de fuite, pas d'automatisme", () => {
    const { h, m } = maison((x) => {
      for (const [id, s] of Object.entries(x.states)) if (s.attributes.device_class === "moisture") delete x.states[id];
    });
    expect(automatisme(h, m, "fuite")).toBeNull();
  });
});

describe("les piles et la sauvegarde", () => {
  it("piles : sous 20 %, sur chaque capteur de pile", () => {
    const { h, m } = maison();
    const a = automatisme(h, m, "pile")!;
    const [declencheur] = a.config.triggers as { trigger: string; entity_id: string[]; below: number }[];
    expect(declencheur.trigger).toBe("numeric_state");
    expect(declencheur.below).toBe(20);
    expect(declencheur.entity_id.length).toBe(m.piles.filter((e) => e.domaine === "sensor").length);
  });

  it("le point « Pile faible » propose de prévenir", () => {
    const { h, m } = maison();
    expect(pointsARegarder(h, m).filter((p) => p.cle.startsWith("pile:")).every((p) => p.prevenir === "pile")).toBe(true);
  });

  it("en anglais, l'automatisme parle anglais", () => {
    const { h, m } = maison((x) => { x.locale = { language: "en" }; });
    expect(automatisme(h, m, "pile")!.config.alias).toBe("Automatic Dashboard: notify when a battery is low");
  });
});

describe("déjà créé", () => {
  it("se reconnaît à l'identifiant de l'automatisme", () => {
    const { h } = maison((x) => {
      x.states["automation.ma_fuite"] = { entity_id: "automation.ma_fuite", state: "on", attributes: { id: "automatic_dashboard_fuite" } };
    });
    expect(automatismeExiste(h, "fuite")).toBe(true);
    expect(automatismeExiste(h, "pile")).toBe(false);
  });
});

describe("qui prévenir", () => {
  it("les téléphones portent le nom de leur appareil", () => {
    const { h } = maison((x) => {
      x.devices["telephone"] = { id: "telephone", name: "Pixel 7", area_id: null };
    });
    expect(telephones(h)).toEqual([{ service: "mobile_app_ipad", nom: "Ipad" }, { service: "mobile_app_pixel", nom: "Pixel" }]);
    const { h: h2 } = maison((x) => {
      (x as any).services.notify = { mobile_app_pixel_7: {} };
      x.devices["telephone"] = { id: "telephone", name: "Pixel 7", area_id: null };
    });
    expect(telephones(h2)).toEqual([{ service: "mobile_app_pixel_7", nom: "Pixel 7" }]);
  });

  it("seulement les destinataires choisis, et ils se relisent dans l'automatisme", () => {
    const { h, m } = maison();
    const a = automatisme(h, m, "pile", { telephones: ["mobile_app_pixel"], homeAssistant: false })!;
    expect((a.config.actions as { action: string }[]).map((x) => x.action)).toEqual(["notify.mobile_app_pixel"]);
    expect(destinatairesDe(a.config as any)).toEqual({ telephones: ["mobile_app_pixel"], homeAssistant: false });
  });
});
