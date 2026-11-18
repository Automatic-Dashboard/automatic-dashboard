// Les sections à glisser dans n'importe quel tableau : chacune donne une section de Home
// Assistant, avec les cartes Automatic Dashboard et les réglages de sa configuration.

import { describe, expect, it } from "vitest";
import type { HomeAssistant } from "../src/ha";
import { genererSection, SECTIONS, sectionEnPanne } from "../src/strategie/sections";
import famille from "./fixtures/famille.json";

const maison = (language = "fr") => ({ ...(structuredClone(famille) as unknown as HomeAssistant), locale: { language } }) as HomeAssistant;
const types = (s: { cards: { type: string }[] }) => s.cards.map((c) => c.type);

describe("les sections", () => {
  it("chacune est une section de cartes, et chaque carte reçoit les réglages", () => {
    for (const nom of SECTIONS) {
      const s = genererSection(nom, { masquer: ["light.salon"] }, maison());
      expect(s.type).toBe("grid");
      expect(s.cards.length).toBeGreaterThan(0);
      for (const c of s.cards.filter((x) => String(x.type).startsWith("custom:"))) expect(c.reglages).toEqual({ masquer: ["light.salon"] });
    }
  });

  it("l'état de la maison : la phrase et le ciel, puis les points à regarder", () => {
    expect(types(genererSection("etat", {}, maison()))).toEqual(["custom:automatic-dashboard-ouverture", "custom:automatic-dashboard-points"]);
  });

  it("le climat suit le choix des pièces en barres ou en mosaïque", () => {
    expect(types(genererSection("climat", {}, maison()))).toContain("custom:automatic-dashboard-confort");
    expect(types(genererSection("climat", { pieces: "mosaique" }, maison()))).toContain("custom:automatic-dashboard-plan");
  });

  it("les titres sont dans la langue de l'utilisateur", () => {
    const titre = (language: string) => (genererSection("depart", {}, maison(language)).cards[0] as { heading?: string }).heading;
    expect(titre("fr")).toBe("Je pars");
    expect(titre("en")).toBe("I'm leaving");
  });

  it("une section en panne le dit en une ligne", () => {
    const s = sectionEnPanne(maison(), new Error("boom"));
    expect((s.cards[0] as { content?: string }).content).toContain("boom");
  });
});
