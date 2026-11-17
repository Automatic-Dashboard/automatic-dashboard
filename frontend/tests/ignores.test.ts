// Ignorer un point pour aujourd'hui : il disparaît de la liste et de la phrase d'accueil,
// revient demain, et un point grave ne s'ignore jamais.

import { afterEach, describe, expect, it } from "vitest";
import { aujourdhui, remettreIgnores } from "../src/donnees/ignores";
import type { HomeAssistant, Instantane } from "../src/ha";
import { analyser } from "../src/moteur/analyser";
import { pointsARegarder, pointsVisibles } from "../src/moteur/points";
import famille from "./fixtures/famille.json";

const maison = (modifier: (h: HomeAssistant) => void = () => {}) => {
  const h = { ...(structuredClone(famille) as unknown as HomeAssistant), locale: { language: "fr" } } as HomeAssistant;
  modifier(h);
  return { h, m: analyser(h as Instantane) };
};

afterEach(() => remettreIgnores());

describe("ignorer un point", () => {
  it("chaque point a une clé stable", () => {
    const { h, m } = maison();
    const points = pointsARegarder(h, m);
    expect(points.length).toBeGreaterThan(0);
    for (const p of points) expect(p.cle).toMatch(/^[a-z]+(:[a-z_]+\.[a-z0-9_]+)?$/);
    expect(new Set(points.map((p) => p.cle)).size).toBe(points.length);
  });

  it("un point ignoré aujourd'hui disparaît, et revient demain", () => {
    const { h, m } = maison();
    const [premier] = pointsARegarder(h, m).filter((p) => p.niveau < 3);
    remettreIgnores({ [premier.cle]: aujourdhui() });
    expect(pointsVisibles(h, m).visibles.map((p) => p.cle)).not.toContain(premier.cle);
    expect(pointsVisibles(h, m).ignores.map((p) => p.cle)).toEqual([premier.cle]);
    remettreIgnores({ [premier.cle]: aujourdhui(new Date(Date.now() - 86400000)) });
    expect(pointsVisibles(h, m).visibles.map((p) => p.cle)).toContain(premier.cle);
  });

  it("un point grave ne s'ignore jamais", () => {
    const { h, m } = maison((x) => {
      x.states["alarm_control_panel.security"].state = "triggered";
    });
    const grave = pointsARegarder(h, m).find((p) => p.niveau === 3)!;
    expect(grave.cle).toBe("alarme:alarm_control_panel.security");
    remettreIgnores({ [grave.cle]: aujourdhui() });
    expect(pointsVisibles(h, m).visibles).toContainEqual(grave);
  });
});
