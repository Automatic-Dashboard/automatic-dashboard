// Les étiquettes de réglage en masse : posées dans Home Assistant sur des entités, des
// appareils ou des pièces, elles masquent, épinglent ou mettent dehors, dans les deux langues.

import { describe, expect, it } from "vitest";
import type { HomeAssistant, Instantane } from "../src/ha";
import { analyser } from "../src/moteur/analyser";
import { choisirFavoris } from "../src/strategie/accueil";
import famille from "./fixtures/famille.json";

const copie = (): Instantane => structuredClone(famille) as unknown as Instantane;
const etiqueter = (liste: { labels?: string[] } | undefined, id: string) => { if (liste) liste.labels = [...(liste.labels ?? []), id]; };
const lumiere = (m: Instantane) => Object.values(m.entities).find((e) => e.entity_id.startsWith("light.") && e.device_id && m.states[e.entity_id])!;

describe("l'étiquette masquer", () => {
  it.each(["automatic_dashboard_masquer", "automatic_dashboard_hide"])("%s sur une entité la masque partout", (id) => {
    const m = copie();
    const en = lumiere(m);
    etiqueter(en, id);
    const e = analyser(m).toutes.find((x) => x.id === en.entity_id)!;
    expect(e.ecart).toBe("masquee_reglage");
    expect(analyser(m).lumieres.map((x) => x.id)).not.toContain(en.entity_id);
  });

  it("sur un appareil, elle masque toutes ses entités", () => {
    const m = copie();
    const en = lumiere(m);
    etiqueter(m.devices[en.device_id!], "automatic_dashboard_masquer");
    const siennes = analyser(m).toutes.filter((e) => e.appareil === en.device_id);
    expect(siennes.length).toBeGreaterThan(0);
    expect(siennes.every((e) => e.ecart === "masquee_reglage" || e.ecart === "masquee")).toBe(true);
  });

  it("sur une pièce, elle retire la pièce et tout ce qu'elle contient", () => {
    const m = copie();
    const avant = analyser(m);
    const piece = avant.pieces.find((p) => p.utiles > 0)!;
    etiqueter(m.areas[piece.area_id], "automatic_dashboard_hide");
    const apres = analyser(m);
    expect(apres.pieces.map((p) => p.area_id)).not.toContain(piece.area_id);
    expect(apres.gardees.some((e) => e.piece === piece.area_id)).toBe(false);
    expect(apres.compteurs.U).toBe(avant.compteurs.U - piece.utiles);
  });
});

describe("l'étiquette favori", () => {
  const hass = (m: Instantane): HomeAssistant => ({ ...(m as HomeAssistant), callWS: async () => ({ entities: [] }) as any });

  it("sur un appareil, sa fonction principale rejoint les favoris, après les épinglés", async () => {
    const m = copie();
    const lumieres = Object.values(m.entities).filter((e) => e.entity_id.startsWith("light.") && e.device_id && !e.name && m.states[e.entity_id]);
    const [epinglee, etiquetee] = lumieres;
    etiqueter(m.devices[etiquetee.device_id!], "automatic_dashboard_favorite");
    const maison = analyser(m);
    expect(maison.favorisEtiquette).toEqual([etiquetee.entity_id]);
    const favoris = await choisirFavoris(hass(m), maison, { favoris: [epinglee.entity_id], completer: false });
    expect(favoris).toEqual([epinglee.entity_id, etiquetee.entity_id]);
  });

  it("sur une entité masquée, elle ne la fait pas revenir", () => {
    const m = copie();
    const en = lumiere(m);
    etiqueter(en, "automatic_dashboard_favori");
    expect(analyser(m, { masquer: [en.entity_id] }).favorisEtiquette).toEqual([]);
  });
});

describe("l'étiquette extérieur", () => {
  it("sur une pièce au nom quelconque, sa température devient celle du dehors", () => {
    const m = copie();
    const avant = analyser(m);
    const piece = avant.pieces.find((p) => !p.exterieur && p.temperatures.length)!;
    etiqueter(m.areas[piece.area_id], "automatic_dashboard_exterieur");
    const apres = analyser(m);
    expect(apres.pieces.find((p) => p.area_id === piece.area_id)!.exterieur).toBe(true);
    expect(apres.temperaturesExterieures).toEqual(expect.arrayContaining(piece.temperatures));
    expect(apres.temperaturesInterieures.length).toBe(avant.temperaturesInterieures.length - 1);
  });
});
