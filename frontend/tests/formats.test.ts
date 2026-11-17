// Les formats de la maison : l'unité des températures et le format de l'heure, choisis dans
// Home Assistant, sont respectés ; les seuils du tableau, écrits en °C, suivent.

import { describe, expect, it } from "vitest";
import type { HomeAssistant } from "../src/ha";
import { couleurTemperature } from "../src/cartes/plan";
import { depuisCelsius, enCelsius } from "../src/moteur/valeurs";
import { heure } from "../src/outils";

const maison = (language: string, time_format?: string, temperature = "°C") =>
  ({ locale: { language, time_format }, config: { latitude: 0, longitude: 0, unit_system: { temperature } } }) as unknown as HomeAssistant;

describe("les degrés Fahrenheit", () => {
  it("convertit une maison en °F avant de la comparer aux seuils, et rien pour une maison en °C", () => {
    expect(enCelsius(maison("en", undefined, "°F"), 68)).toBeCloseTo(20);
    expect(enCelsius(maison("fr"), 20)).toBe(20);
    expect(depuisCelsius(maison("en", undefined, "°F"), 22)).toBeCloseTo(71.6);
  });

  it("colore 72 °F comme 22 °C, pas comme une pièce brûlante", () => {
    const h = maison("en", undefined, "°F");
    expect(couleurTemperature(enCelsius(h, 72))).toBe(couleurTemperature(22.2));
    expect(couleurTemperature(enCelsius(h, 72))).not.toBe(couleurTemperature(72));
  });
});

describe("le format de l'heure", () => {
  const d = new Date(2026, 10, 17, 19, 34);

  it("« 19 h 34 » en français, sauf si le profil demande 12 heures", () => {
    expect(heure(maison("fr"), d)).toBe("19 h 34");
    expect(heure(maison("fr", "24"), d)).toBe("19 h 34");
    expect(heure(maison("fr", "12"), d)).toMatch(/7:34/u);
  });

  it("en anglais, 12 ou 24 heures selon le profil", () => {
    expect(heure(maison("en", "12"), d)).toMatch(/^7:34\s?PM$/u);
    expect(heure(maison("en", "24"), d)).toBe("19:34");
  });
});
