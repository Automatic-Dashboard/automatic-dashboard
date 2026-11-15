// L'algorithme des rangées : aucune rangée à trou, ni sur téléphone (12 cases) ni sur
// ordinateur (24 cases), quel que soit le nombre de cartes.

import { describe, expect, it } from "vitest";
import { rangees, remplissage } from "../src/mise-en-page/rangees";

describe("rangées pleines", () => {
  for (const base of [4, 6] as const) {
    for (const mode of ["promotion", "fin"] as const) {
      it(`base ${base}, ${mode} : de 1 à 24 cartes`, () => {
        for (let n = 1; n <= 24; n++) {
          const largeurs = rangees(n, base, mode);
          expect(largeurs.length).toBe(n);
          for (const colonnes of [12, 24] as const) {
            const lignes = remplissage(largeurs, colonnes);
            expect(lignes.every((l) => l === colonnes), `n=${n}, grille ${colonnes} : ${largeurs.join(",")}`).toBe(true);
          }
        }
      });
    }
  }

  it("la promotion met la carte la plus importante en double largeur, en tête", () => {
    expect(rangees(7, 6, "promotion")).toEqual([12, 6, 6, 6, 6, 6, 6]);
    expect(rangees(5, 6, "fin")).toEqual([6, 6, 6, 6, "full"]);
  });

  it("jamais de largeur 8 ni 16, qui font des trous sur téléphone", () => {
    for (let n = 1; n <= 30; n++) {
      for (const l of [...rangees(n, 4), ...rangees(n, 6)]) expect([4, 6, 12, "full"]).toContain(l);
    }
  });
});
