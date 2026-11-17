// Le ciel du jour, la maison en plan, la tablette murale : leurs calculs.

import { describe, expect, it } from "vitest";
import { ageLune, journee, luneEclairee } from "../src/cartes/ciel";
import { couleurTemperature } from "../src/cartes/plan";
import { estNuit } from "../src/cartes/tablette";

describe("le ciel du jour", () => {
  const soleil = (rising: string, setting: string) => ({ attributes: { next_rising: rising, next_setting: setting } });

  it("en pleine journée : le lever d'aujourd'hui est 24 heures avant le prochain", () => {
    const j = journee(soleil("2026-11-18T07:35:00", "2026-11-17T17:12:00"), new Date("2026-11-17T12:23:00"))!;
    expect(j.lever.getHours()).toBe(7);
    expect(j.lever.getDate()).toBe(17);
    // Midi et quart, à mi-chemin entre 7 h 35 et 17 h 12.
    expect(j.avancement).toBeGreaterThan(0.45);
    expect(j.avancement).toBeLessThan(0.55);
  });

  it("avant l'aube : la journée n'a pas commencé", () => {
    const j = journee(soleil("2026-11-17T07:34:00", "2026-11-17T17:12:00"), new Date("2026-11-17T05:00:00"))!;
    expect(j.avancement).toBeLessThan(0);
  });

  it("le soir : la journée est finie", () => {
    const j = journee(soleil("2026-11-18T07:35:00", "2026-11-18T17:11:00"), new Date("2026-11-17T21:00:00"))!;
    expect(j.avancement).toBeGreaterThan(1);
  });

  it("sans sun.sun, pas de ciel", () => {
    expect(journee(undefined, new Date())).toBeNull();
  });

  it("la lune : nouvelle, pleine, et un croissant éclairé à droite quand elle croît", () => {
    expect(ageLune(new Date(Date.UTC(2000, 0, 6, 18, 14)))).toBeCloseTo(0, 5);
    expect(ageLune(new Date(Date.UTC(2000, 0, 6, 18, 14) + 14.765 * 86400000))).toBeCloseTo(0.5, 2);
    // Premier croissant : le bord éclairé passe à droite (balayage 1), le terminateur revient par la droite (0).
    expect(luneEclairee(50, 50, 10, 0.1)).toMatch(/^M50 40A10 10 0 0 1 50 60A[\d.]+ 10 0 0 0 50 40Z$/);
    // Gibbeuse décroissante : bord à gauche (0), terminateur par la droite (0).
    expect(luneEclairee(50, 50, 10, 0.65)).toMatch(/^M50 40A10 10 0 0 0 50 60A[\d.]+ 10 0 0 0 50 40Z$/);
  });
});

describe("la maison en plan", () => {
  it.each([[15.5, "#4F8FD9"], [18, "#5FB3D6"], [20.5, "#5DB88A"], [23, "#E9A23B"], [26, "#D9614F"], [null, null]])("%s° → %s", (t, c) => {
    expect(couleurTemperature(t)).toBe(c);
  });
});

describe("la tablette murale", () => {
  it.each([["23:10", true], ["02:00", true], ["05:59", true], ["06:00", false], ["14:00", false], ["22:59", false]])("%s : nuit = %s", (h, nuit) => {
    expect(estNuit(new Date(`2026-11-17T${h}:00`))).toBe(nuit);
  });
});
