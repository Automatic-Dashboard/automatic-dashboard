import { describe, expect, it } from "vitest";
import type { EtatHA } from "../src/ha";
import { lirePluie, lireVigilance } from "../src/moteur/meteo-france";

// Les tranches telles que Météo-France les donne : par 5 minutes, puis par 10 après la demi-heure.
const CLES = ["0 min", "5 min", "10 min", "15 min", "20 min", "25 min", "35 min", "45 min", "55 min"];
const pluie = (textes: string[], state = "unknown"): EtatHA => ({
  entity_id: "sensor.marseille_next_rain",
  state,
  attributes: { forecast_time_ref: "2026-11-16T20:20:00+00:00", "1_hour_forecast": Object.fromEntries(CLES.map((c, i) => [c, textes[i]])) },
});
const sec = Array(9).fill("Temps sec");

describe("pluie dans l'heure", () => {
  it("une heure sèche, capteur à « unknown » : pas de pluie, et on le dit", () => {
    const p = lirePluie(pluie(sec));
    expect(p).not.toBeNull();
    expect(p!.dans).toBeNull();
    expect(p!.tranches.reduce((s, t) => s + t.duree, 0)).toBe(60);
    expect(p!.reference?.toISOString()).toBe("2026-11-16T20:20:00.000Z");
  });

  it("les tranches après la demi-heure durent 10 minutes", () => {
    const textes = [...sec];
    textes[6] = "Pluie modérée";
    const p = lirePluie(pluie(textes, "2026-11-16T20:55:00+00:00"))!;
    expect(p.dans).toBe(35);
    expect(p.type).toBe("Pluie modérée");
    expect(p.tranches[6]).toMatchObject({ debut: 35, duree: 10, intensite: 2 });
  });

  it("il pleut puis ça s'arrête, ou il pleut toute l'heure", () => {
    const fin = lirePluie(pluie(["Pluie faible", "Pluie faible", "Pluie forte", ...sec.slice(3)]))!;
    expect(fin.dans).toBe(0);
    expect(fin.fin).toBe(15);
    expect(fin.continue).toBe(false);
    const toute = lirePluie(pluie(Array(9).fill("Pluie faible")))!;
    expect(toute.continue).toBe(true);
    expect(toute.fin).toBeNull();
  });

  it("capteur indisponible ou sans prévision : on se tait", () => {
    expect(lirePluie(undefined)).toBeNull();
    expect(lirePluie(pluie(sec, "unavailable"))).toBeNull();
    expect(lirePluie({ entity_id: "sensor.x", state: "unknown", attributes: {} })).toBeNull();
  });
});

describe("vigilance", () => {
  const vigilance = (state: string, phenomenes: Record<string, string>): EtatHA =>
    ({ entity_id: "sensor.13_weather_alert", state, attributes: { ...phenomenes, attribution: "Data provided by Météo-France" } });

  it("vert : niveau 0, aucun phénomène", () => {
    expect(lireVigilance(vigilance("Vert", { Orages: "Vert", "Vent violent": "Vert" }))).toEqual({ niveau: 0, phenomenes: [] });
  });

  it("orange : les phénomènes qui ne sont pas verts, du plus grave au moins grave", () => {
    const v = lireVigilance(vigilance("Orange", { "Vent violent": "Jaune", "Pluie-inondation": "Orange", Orages: "Vert" }))!;
    expect(v.niveau).toBe(2);
    expect(v.phenomenes.map((p) => p.nom)).toEqual(["Pluie-inondation", "Vent violent"]);
  });

  it("inconnue ou indisponible : rien, jamais « pas de vigilance »", () => {
    expect(lireVigilance(vigilance("unknown", {}))).toBeNull();
    expect(lireVigilance(vigilance("unavailable", {}))).toBeNull();
    expect(lireVigilance(undefined)).toBeNull();
  });
});
