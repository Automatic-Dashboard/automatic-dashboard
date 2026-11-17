// Le diagnostic à copier : la maison décrite sans noms ni valeurs doit se trier exactement
// comme la vraie, sinon un ticket ne pourrait pas devenir un cas de test.

import { describe, expect, it } from "vitest";
import { anonymiserNom, diagnostiquer, texteDiagnostic } from "../src/diagnostic";
import type { HomeAssistant, Instantane } from "../src/ha";
import { analyser } from "../src/moteur/analyser";
import { genererTableau } from "../src/strategie/strategie";
import complete from "./fixtures/complete.json";
import debutant from "./fixtures/debutant.json";
import famille from "./fixtures/famille.json";

const hass = (f: unknown): HomeAssistant => ({
  ...(f as HomeAssistant), locale: { language: "fr" }, user: { id: "essai", name: "Essai", is_admin: true },
  callWS: async () => ({ entities: [] }) as any,
});
const maisons = { debutant: hass(debutant), famille: hass(famille), complete: hass(complete) };

/** Retrouve, dans le diagnostic, l'identifiant donné à une entité de la vraie maison. */
function correspondance(h: HomeAssistant) {
  const d = diagnostiquer(h, {}, Object.keys(h.states));
  return { d, vers: new Map(Object.keys(h.states).map((id, i) => [id, d.signalement[i]?.entite])) };
}

describe("anonymiser un nom", () => {
  it("ne garde que les mots que les règles lisent", () => {
    expect(anonymiserNom("Prise du bureau de Léa Signal WiFi", "nom")).toBe("bureau signal wifi");
    expect(anonymiserNom("Chambre de Léa", "Pièce 1")).toBe("chambre");
    expect(anonymiserNom("Compteur Linky", "nom")).toBe("compteur linky");
    expect(anonymiserNom("Lampe de Jean-Michel", "nom")).toBe("nom");
    expect(anonymiserNom(null, "appareil")).toBe("appareil");
  });
});

describe.each(Object.entries(maisons))("maison %s : le diagnostic se trie comme la vraie", (_nom, h) => {
  const { d, vers } = correspondance(h);
  const vraie = analyser(h);
  const decrite = analyser(d.maison as unknown as Instantane);

  it("même mode et mêmes compteurs", () => {
    expect(decrite.mode).toBe(vraie.mode);
    expect(decrite.compteurs).toEqual(vraie.compteurs);
    expect(d.resultat).toMatchObject({ mode: vraie.mode, ...vraie.compteurs });
  });

  it("chaque entité reçoit le même verdict", () => {
    const parId = new Map(decrite.toutes.map((e) => [e.id, e]));
    for (const e of vraie.toutes) {
      const f = parId.get(vers.get(e.id)!);
      expect([e.id, f?.ecart, f?.role, f?.section]).toEqual([e.id, e.ecart, e.role, e.section]);
    }
  });

  it("mêmes choix de la maison : pièces, à ranger, réseau, météo, températures", () => {
    expect(decrite.pieces.map((p) => p.entites.length)).toEqual(vraie.pieces.map((p) => p.entites.length));
    expect(decrite.aRanger.map((e) => e.id)).toEqual(vraie.aRanger.map((e) => vers.get(e.id)));
    expect(decrite.puissanceReseau).toBe(vraie.puissanceReseau ? vers.get(vraie.puissanceReseau) : null);
    expect(decrite.meteo).toBe(vraie.meteo ? vers.get(vraie.meteo) : null);
    expect(decrite.meteoFrance).toBe(vraie.meteoFrance ? vers.get(vraie.meteoFrance) : null);
    expect(decrite.temperaturesInterieures.length).toBe(vraie.temperaturesInterieures.length);
    expect(decrite.pieces.map((p) => [p.exterieur, p.annexe, p.icon])).toEqual(vraie.pieces.map((p) => [p.exterieur, p.annexe, p.icon]));
  });

  it("le tableau se génère sur la maison décrite, avec les mêmes pages", async () => {
    const t1 = await genererTableau({}, h);
    const t2 = await genererTableau({}, hass(d.maison));
    expect(t2.views.length).toBe(t1.views.length);
  });

  it("aucun nom choisi par l'habitant ne sort", () => {
    const texte = texteDiagnostic(diagnostiquer(h)).toLowerCase();
    // Les mots techniques gardés exprès (intégrations, fabricants, modèles, domaines) ne sont pas des noms.
    const publics = new Set<string>();
    const ajouter = (s?: string | null) => s?.toLowerCase().split(/[^\p{L}\p{N}]+/u).forEach((m) => publics.add(m));
    for (const en of Object.values(h.entities)) { ajouter(en.platform); ajouter(en.entity_id); ajouter(en.translation_key); }
    for (const a of Object.values(h.devices)) { ajouter(a.manufacturer); ajouter(a.model); }
    for (const s of Object.values(h.states)) for (const c of ["device_class", "unit_of_measurement", "icon"]) ajouter(String(s.attributes[c] ?? ""));
    h.config.components?.forEach(ajouter);
    // Les clés du format et les mots des noms de remplacement.
    ["supported_features", "state_class", "hvac_modes", "étage", "pièce", "appareil"].forEach(ajouter);
    const noms = [
      ...Object.values(h.areas).map((a) => a.name), ...Object.values(h.floors).map((f) => f.name),
      ...Object.values(h.devices).flatMap((a) => [a.name, a.name_by_user]),
      ...Object.values(h.states).map((s) => s.attributes.friendly_name as string | undefined),
      h.config.location_name,
    ];
    const fuites = new Set<string>();
    for (const nom of noms) {
      for (const mot of nom?.toLowerCase().split(/[^\p{L}\p{N}]+/u) ?? []) {
        if (mot.length < 4 || publics.has(mot) || anonymiserNom(mot, "") === mot) continue;
        if (new RegExp(`(^|[^\\p{L}])${mot}([^\\p{L}]|$)`, "u").test(texte)) fuites.add(mot);
      }
    }
    expect([...fuites]).toEqual([]);
    expect(texte).not.toMatch(/"latitude": [1-9]/);
  });

  it("aucune valeur ne sort : nombres à 0, présences inconnues", () => {
    for (const s of Object.values(d.maison.states)) {
      expect(s.state).toMatch(/^(0|[a-z_]{1,30}|Vert|Jaune|Orange|Rouge)$/);
      if (/^(person|device_tracker)\./.test(s.entity_id)) expect(s.state).toBe("unknown");
    }
  });
});

describe("le signalement", () => {
  it("dit ce que le tri a fait des entités signalées, avec les identifiants du diagnostic", () => {
    const h = maisons.famille;
    const id = Object.keys(h.entities).find((x) => x.startsWith("light.") && h.states[x])!;
    const d = diagnostiquer(h, {}, [id, "light.inexistante"]);
    expect(d.signalement).toHaveLength(1);
    expect(d.signalement[0]).toMatchObject({ domaine: "light", verdict: { ecart: null, role: "commande", section: "pieces" } });
    expect(d.signalement[0].entite).toMatch(/^light\.n\d+$/);
    expect(d.maison.states[d.signalement[0].entite]).toBeDefined();
  });

  it("les réglages suivent, avec les mêmes identifiants ; les noms choisis restent chez soi", () => {
    const h = maisons.famille;
    const [a, b] = Object.keys(h.entities).filter((x) => x.startsWith("light.") && h.states[x]);
    const d = diagnostiquer(h, { masquer: [a], favoris: [b], noms: { [b]: "Lampe de Léa" } });
    expect(d.reglages.masquer).toHaveLength(1);
    expect(d.reglages.favoris).toHaveLength(1);
    expect(JSON.stringify(d)).not.toContain("Léa");
  });
});
