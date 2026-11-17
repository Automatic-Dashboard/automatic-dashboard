// Ignorer un point tant que ça ne change pas : il disparaît de la liste et de la phrase
// d'accueil, revient dès qu'il change, et un point grave ne s'ignore jamais.

import { afterEach, describe, expect, it } from "vitest";
import { remettreIgnores } from "../src/donnees/ignores";
import type { HomeAssistant, Instantane } from "../src/ha";
import { analyser } from "../src/moteur/analyser";
import { pointsARegarder, pointsVisibles, signature } from "../src/moteur/points";
import famille from "./fixtures/famille.json";

const maison = (modifier: (h: HomeAssistant) => void = () => {}) => {
  const h = { ...(structuredClone(famille) as unknown as HomeAssistant), locale: { language: "fr" } } as HomeAssistant;
  modifier(h);
  return { h, m: analyser(h as Instantane) };
};
const ignorerTous = (h: HomeAssistant, points: ReturnType<typeof pointsARegarder>) =>
  remettreIgnores(Object.fromEntries(points.map((p) => [p.cle, { s: signature(h, p), t: Date.now() }])));

afterEach(() => remettreIgnores());

describe("ignorer un point", () => {
  it("chaque point a une clé stable", () => {
    const { h, m } = maison();
    const points = pointsARegarder(h, m);
    expect(points.length).toBeGreaterThan(0);
    for (const p of points) expect(p.cle).toMatch(/^[a-z-]+(:[a-z_]+\.[a-z0-9_]+)?$/);
    expect(new Set(points.map((p) => p.cle)).size).toBe(points.length);
  });

  it("une fenêtre ignorée disparaît, et revient quand on la referme puis la rouvre", () => {
    const { h, m } = maison();
    const fenetre = pointsARegarder(h, m).find((p) => p.cle.startsWith("ouvrant:"))!;
    ignorerTous(h, [fenetre]);
    expect(pointsVisibles(h, m).visibles.map((p) => p.cle)).not.toContain(fenetre.cle);
    expect(pointsVisibles(h, m).ignores.map((p) => p.cle)).toEqual([fenetre.cle]);
    // Refermée puis rouverte : l'heure du dernier changement n'est plus la même.
    h.states[fenetre.entite!] = { ...h.states[fenetre.entite!], last_changed: "2026-11-17T20:00:00+00:00" };
    expect(pointsVisibles(h, m).visibles.map((p) => p.cle)).toContain(fenetre.cle);
  });

  it("une pile ignorée revient quand elle passe sous 10 %", () => {
    const pile = (valeur: string) => maison((x) => {
      const id = Object.keys(x.states).find((k) => x.states[k].attributes.device_class === "battery" && k.startsWith("sensor."))!;
      x.states[id] = { ...x.states[id], state: valeur };
    });
    const avant = pile("15");
    const point = pointsARegarder(avant.h, avant.m).find((p) => p.cle.startsWith("pile:"))!;
    ignorerTous(avant.h, [point]);
    expect(pointsVisibles(avant.h, avant.m).visibles.some((p) => p.cle === point.cle)).toBe(false);
    const apres = pile("8");
    expect(pointsVisibles(apres.h, apres.m).visibles.some((p) => p.cle === point.cle)).toBe(true);
  });

  it("un point grave ne s'ignore jamais", () => {
    const { h, m } = maison((x) => {
      x.states["alarm_control_panel.security"].state = "triggered";
    });
    const grave = pointsARegarder(h, m).find((p) => p.niveau === 3)!;
    expect(grave.cle).toBe("alarme:alarm_control_panel.security");
    ignorerTous(h, [grave]);
    expect(pointsVisibles(h, m).visibles).toContainEqual(grave);
  });
});
