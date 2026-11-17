// « À ranger » propose la pièce d'après le nom de l'appareil.

import { describe, expect, it } from "vitest";
import type { Instantane } from "../src/ha";
import { analyser } from "../src/moteur/analyser";
import { proposerPiece } from "../src/moteur/ranger";
import complete from "./fixtures/complete.json";
import famille from "./fixtures/famille.json";

const pieces = [
  { area_id: "salon", name: "Salon" },
  { area_id: "chambre", name: "Chambre" },
  { area_id: "enfants", name: "Chambre des enfants", aliases: ["Chambre de Léa"] },
  { area_id: "sdb", name: "Salle de bain" },
  { area_id: "entree", name: "Entrée" },
];

describe("proposer une pièce d'après le nom", () => {
  it.each([
    ["Lampe du salon", "salon"],
    ["Prise salon TV", "salon"],
    ["Veilleuse chambre des enfants", "enfants"], // le nom le plus long l'emporte
    ["Veilleuse chambre de Léa", "enfants"], // par un alias
    ["Plafonnier Chambre", "chambre"],
    ["Détecteur entree", "entree"], // sans accent
    ["Bathroom fan", "sdb"], // le type de pièce, en anglais
    ["Living room lamp", "salon"],
  ])("« %s » → %s", (nom, attendu) => {
    expect(proposerPiece(nom, pieces)).toBe(attendu);
  });

  it.each([
    ["Lampe de chevet", "aucun nom de pièce"],
    ["Bedroom lamp", "deux chambres possibles : rien n'est sûr"],
    ["Salonnière", "un mot qui contient « salon » n'est pas le salon"],
    ["", "pas de nom"],
  ])("« %s » → rien (%s)", (nom) => {
    expect(proposerPiece(nom, pieces)).toBeNull();
  });
});

describe("dans le tri", () => {
  it("chaque appareil à ranger dont le nom désigne une pièce reçoit une proposition", () => {
    const m = structuredClone(famille) as unknown as Instantane;
    const avant = analyser(m);
    expect(avant.aRanger.length).toBeGreaterThan(0);
    const e = avant.aRanger.find((x) => x.appareil)!;
    m.devices[e.appareil!].name_by_user = "Lampe d'appoint du salon";
    const apres = analyser(m);
    const salon = apres.pieces.find((p) => p.name === "Salon")!;
    expect(apres.propositions[e.id]).toBe(salon.area_id);
  });

  it("les propositions ne visent que des appareils à ranger", () => {
    for (const maison of [famille, complete]) {
      const m = analyser(maison as unknown as Instantane);
      for (const id of Object.keys(m.propositions)) expect(m.aRanger.map((e) => e.id)).toContain(id);
    }
  });
});
