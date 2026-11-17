// La stratégie complète, générée pour les trois maisons d'essai : bonnes pages,
// aucune page en colonne étroite, des largeurs qui gardent les rangées pleines.

import { describe, expect, it } from "vitest";
import type { HomeAssistant } from "../src/ha";
import type { CarteConfig, VueConfig } from "../src/strategie/configs";
import { genererTableau } from "../src/strategie/strategie";
import complete from "./fixtures/complete.json";
import debutant from "./fixtures/debutant.json";
import famille from "./fixtures/famille.json";

const BALISES = ["automatic-dashboard-ouverture", "automatic-dashboard-pastille", "automatic-dashboard-points", "automatic-dashboard-piece", "automatic-dashboard-apercu",
  "automatic-dashboard-premiers-pas", "automatic-dashboard-heros", "automatic-dashboard-confort", "automatic-dashboard-a-ranger",
  "automatic-dashboard-meteo-france", "automatic-dashboard-moment", "automatic-dashboard-bilan", "automatic-dashboard-plan", "automatic-dashboard-favori", "automatic-dashboard-depart", "automatic-dashboard-mes-favoris"];

function hass(fixture: unknown): HomeAssistant {
  const f = fixture as HomeAssistant;
  return {
    ...f,
    user: { id: "essai", name: "Antonin (essai)", is_admin: true },
    locale: { language: "fr" },
    // Pas de prédiction d'usage dans une installation neuve : la stratégie choisit elle-même.
    callWS: async () => ({ entities: [] }) as any,
  };
}

const tableaux = {
  debutant: await genererTableau({}, hass(debutant)),
  famille: await genererTableau({}, hass(famille)),
  complete: await genererTableau({}, hass(complete)),
};
const chemins = (vues: VueConfig[]) => vues.map((v) => v.path);
const cartes = (v: VueConfig): CarteConfig[] => [
  ...v.sections.flatMap((s) => s.cards), ...(v.sidebar?.sections.flatMap((s) => s.cards) ?? []), ...v.badges, v.header.card as CarteConfig,
];

describe("chaque maison a ses pages", () => {
  it("maison débutant : accueil, sa pièce, climat, système, à ranger ; ni énergie ni sécurité sans capteurs", () => {
    const p = chemins(tableaux.debutant.views);
    expect(p[0]).toBe("accueil");
    expect(p).toEqual(expect.arrayContaining(["salon", "climat", "systeme", "a-ranger"]));
    expect(p).not.toContain("energie");
    expect(p).not.toContain("securite");
  });

  it("maison famille : toutes les pages thématiques", () => {
    expect(chemins(tableaux.famille.views)).toEqual(expect.arrayContaining(["accueil", "climat", "energie", "securite", "systeme", "a-ranger"]));
  });

  it("maison complète : une page par pièce, et les pièces vides n'en ont pas", () => {
    const p = chemins(tableaux.complete.views);
    expect(p).toEqual(expect.arrayContaining(["climat", "energie", "securite", "systeme"]));
    expect(p.filter((x) => !["accueil", "climat", "energie", "securite", "systeme", "a-ranger", "bilan", "tablette", "depart", "mes-favoris", "air", "vehicule", "exterieur"].includes(x)).length).toBe(13);
  });
});

describe("l'accueil suit le mode", () => {
  const accueil = (nom: keyof typeof tableaux) => tableaux[nom].views[0];

  it("Découverte : météo en grand et premiers pas, pas de liste de pièces", () => {
    const types = cartes(accueil("debutant")).map((c) => c.type);
    expect(types).toContain("custom:automatic-dashboard-premiers-pas");
    expect(types).not.toContain("custom:automatic-dashboard-piece");
    expect(accueil("debutant").sections[0].cards[0]).toMatchObject({ type: "weather-forecast", grid_options: { columns: "full" } });
  });

  it("Maison : une tuile par pièce équipée, la plus équipée en double largeur", () => {
    const pieces = cartes(accueil("famille")).filter((c) => c.type === "custom:automatic-dashboard-piece");
    expect(pieces.length).toBe(7);
    expect(pieces[0].grid_options?.columns).toBe(12);
  });

  it("Complet : les pièces regroupées par étage, en petit format", () => {
    const titres = accueil("complete").sections.flatMap((s) => s.cards).filter((c) => c.type === "heading").map((c) => c.heading);
    expect(titres).toEqual(expect.arrayContaining(["Rez-de-chaussée", "Étage"]));
    const largeurs = cartes(accueil("complete")).filter((c) => c.type === "custom:automatic-dashboard-piece").map((c) => c.grid_options?.columns);
    expect(largeurs).toContain(4);
  });
});

describe("la mise en page", () => {
  for (const [nom, tableau] of Object.entries(tableaux)) {
    it(`${nom} : aucune page en colonne étroite`, () => {
      for (const v of tableau.views.filter((x) => x.type === "sections")) {
        expect(v.type).toBe("sections");
        expect(v.theme).toBe("Automatic Dashboard");
        expect(v.max_columns).toBe(3);
        for (const s of v.sections) expect(s.column_span, `${v.path}`).toBe(2);
      }
    });

    it(`${nom} : des largeurs qui gardent les rangées pleines (4, 6, 12 ou pleine largeur)`, () => {
      for (const v of tableau.views.filter((x) => x.type === "sections")) {
        for (const c of cartes(v)) {
          const l = c.grid_options?.columns;
          if (l !== undefined) expect([4, 6, 12, "full"], `${v.path} : ${c.type}`).toContain(l);
        }
      }
    });

    it(`${nom} : seules des cartes Automatic Dashboard connues sont utilisées`, () => {
      for (const v of tableau.views.filter((x) => x.type === "sections")) {
        for (const c of cartes(v).filter((x) => x.type.startsWith("custom:"))) {
          expect(BALISES).toContain(c.type.slice("custom:".length));
        }
      }
    });
  }
});

describe("pluie, vigilance et « en ce moment » sur l'accueil", () => {
  const accueil = (nom: keyof typeof tableaux) => tableaux[nom].views[0];
  const cote = (v: VueConfig) => v.sidebar?.sections.flatMap((s) => s.cards).map((c) => c.type) ?? [];

  it("Découverte : la pluie et la vigilance sous la grande météo, plus de tuile de vigilance native", () => {
    const premiere = accueil("debutant").sections[0].cards.map((c) => c.type);
    expect(premiere).toEqual(["weather-forecast", "custom:automatic-dashboard-meteo-france"]);
    expect(cartes(accueil("debutant")).some((c) => c.type === "tile" && String(c.entity).endsWith("_weather_alert"))).toBe(false);
  });

  it("Maison : Météo-France juste sous la météo, « en ce moment » avant l'éphéméride", () => {
    const c = cote(accueil("famille"));
    expect(c.indexOf("custom:automatic-dashboard-meteo-france")).toBe(c.indexOf("weather-forecast") + 1);
    expect(c.indexOf("custom:automatic-dashboard-moment")).toBe(c.length - 2);
  });

  it("sans Météo-France, pas de carte Météo-France", () => {
    expect(cartes(accueil("complete")).some((c) => c.type === "custom:automatic-dashboard-meteo-france")).toBe(false);
  });

  it("la carte météo porte le nom de la maison, pas celui de l'intégration", () => {
    const meteo = cartes(accueil("famille")).find((c) => c.type === "weather-forecast");
    expect(meteo?.name).toBe("Appartement d'essai");
  });
});
