// Le moteur de tri, essayé sur les trois maisons d'essai exportées de Home Assistant
// (dev/scripts/exporter_maison.py) : débutant, famille et maison complète.

import { describe, expect, it } from "vitest";
import type { Instantane } from "../src/ha";
import { analyser, choisirMode } from "../src/moteur/analyser";
import complete from "./fixtures/complete.json";
import debutant from "./fixtures/debutant.json";
import famille from "./fixtures/famille.json";

const maisons = { debutant, famille, complete } as unknown as Record<string, Instantane>;

describe("le mode est détecté tout seul", () => {
  it.each([
    ["debutant", "decouverte"],
    ["famille", "maison"],
    ["complete", "complet"],
  ])("maison %s → mode %s", (nom, attendu) => {
    expect(analyser(maisons[nom]).mode).toBe(attendu);
  });

  it("le mode peut être forcé", () => {
    expect(analyser(maisons.complete, { mode: "decouverte" }).mode).toBe("decouverte");
    expect(analyser(maisons.complete, { mode: "auto" }).mode).toBe("complet");
  });

  it("les seuils suivent la règle du document de conception", () => {
    expect(choisirMode(3, 3, 1, 19)).toBe("decouverte");
    expect(choisirMode(16, 5, 2, 40)).toBe("maison"); // une carte de 16 relais remplit déjà un tableau
    expect(choisirMode(100, 80, 6, 120)).toBe("complet");
    expect(choisirMode(60, 50, 12, 120)).toBe("complet");
    expect(choisirMode(60, 50, 7, 120)).toBe("maison");
  });
});

describe("aucune entité n'est perdue", () => {
  it.each(Object.keys(maisons))("maison %s : chaque entité est soit écartée avec une raison, soit rangée", (nom) => {
    const m = analyser(maisons[nom]);
    for (const e of m.toutes) {
      expect(Boolean(e.ecart) !== Boolean(e.role), e.id).toBe(true);
    }
  });
});

describe("on écarte d'abord", () => {
  const m = analyser(maisons.complete);
  const par = (id: string) => m.toutes.find((e) => e.id === id)!;

  it("les entités de diagnostic et de configuration ne s'affichent pas", () => {
    const techniques = m.toutes.filter((e) => e.categorie === "diagnostic" || e.categorie === "config");
    expect(techniques.length).toBeGreaterThan(20);
    for (const e of techniques) {
      // sauf piles, mises à jour et plateformes système, rangées en Système
      expect(e.ecart !== null || e.section === "systeme", e.id).toBe(true);
    }
  });

  it("piles et mises à jour vont en Système, même rangées en diagnostic ou configuration", () => {
    expect(m.piles.length).toBeGreaterThan(30);
    expect(m.piles.every((e) => e.role === "maintenance")).toBe(true);
    expect(m.majs.length).toBe(16);
  });

  it("les réglages des têtes thermostatiques restent cachés", () => {
    const reglages = m.toutes.filter((e) => /verrou_enfant|fenetre_ouverte|calibration/.test(e.id));
    expect(reglages.length).toBeGreaterThan(0);
    expect(reglages.every((e) => e.ecart?.startsWith("categorie_"))).toBe(true);
  });

  it("les démonstrations masquées dans la maison famille sont écartées", () => {
    const f = analyser(maisons.famille);
    expect(f.toutes.find((e) => e.id === "vacuum.demo_vacuum_1_first_floor")?.ecart).toBe("masquee");
    expect(par("sensor.sun_next_dawn")?.ecart ?? "absent").not.toBe(null);
  });
});

describe("une entité principale par appareil, un représentant par mesure", () => {
  it("la température d'une pièce vient de son thermomètre, pas d'une tête thermostatique", () => {
    const m = analyser(maisons.complete);
    const tom = m.pieces.find((p) => p.name === "Chambre de Tom")!;
    expect(tom.temperatures.length).toBeGreaterThan(0);
    const premier = m.toutes.find((e) => e.id === tom.temperatures[0])!;
    expect(premier.classe).toBe("temperature");
    expect(premier.id).toMatch(/temperature/);
  });

  it("les capteurs sans appareil de la maison famille représentent leur pièce", () => {
    const m = analyser(maisons.famille);
    expect(m.pieces.find((p) => p.area_id === "salon")?.temperatures[0]).toBe("sensor.temperature_salon");
  });

  it("une lumière d'appareil est sa fonction principale", () => {
    const m = analyser(maisons.complete);
    const lumieres = m.gardees.filter((e) => e.domaine === "light");
    expect(lumieres.length).toBe(16);
    expect(lumieres.every((e) => e.principale)).toBe(true);
  });
});

describe("pièces, étages et extérieur", () => {
  const m = analyser(maisons.complete);

  it("les pièces sont rangées par étage", () => {
    expect(m.etages.map((f) => f.name)).toEqual(["Rez-de-chaussée", "Étage"]);
    const niveaux = m.pieces.map((p) => m.etages.findIndex((f) => f.floor_id === p.etage));
    expect([...niveaux].sort((a, b) => a - b)).toEqual(niveaux);
  });

  it("le jardin est dehors, le garage est une annexe : ni l'un ni l'autre dans la moyenne « dedans »", () => {
    expect(m.pieces.find((p) => p.name === "Jardin")?.exterieur).toBe(true);
    expect(m.pieces.find((p) => p.name === "Garage")?.annexe).toBe(true);
    expect(m.temperaturesExterieures.length).toBe(1);
    const dedans = m.temperaturesInterieures.flat();
    const jardin = m.pieces.find((p) => p.name === "Jardin")!.temperatures;
    expect(dedans.some((id) => jardin.includes(id))).toBe(false);
  });

  it("une pièce sans icône en reçoit une d'après son nom", () => {
    expect(m.pieces.find((p) => p.name === "Cuisine")?.icon).toBe("mdi:stove");
    expect(m.pieces.find((p) => p.name === "Salle de bain")?.icon).toBe("mdi:shower");
  });
});

describe("énergie : jamais la somme des prises", () => {
  it("maison complète : la puissance vient du compteur Linky", () => {
    const m = analyser(maisons.complete);
    expect(m.puissanceReseau).toMatch(/linky/);
  });
  it("maison famille : la consommation de la maison, pas le lave-linge", () => {
    expect(analyser(maisons.famille).puissanceReseau).toBe("sensor.consommation_de_la_maison");
  });
  it("maison débutant : rien à afficher", () => {
    expect(analyser(maisons.debutant).puissanceReseau).toBe(null);
  });
});

describe("à ranger", () => {
  it("les appareils sans pièce y vont, jamais les services ni les capteurs de la maison entière", () => {
    const m = analyser(maisons.famille);
    const ids = m.aRanger.map((e) => e.id);
    expect(ids).toContain("fan.living_room_fan");
    expect(ids).toContain("sensor.carbon_dioxide");
    expect(ids.some((id) => id.startsWith("weather.") || id.startsWith("sensor.backup_"))).toBe(false);
    expect(ids).not.toContain("sensor.consommation_de_la_maison");
  });
  it("maison débutant : la prise sans pièce", () => {
    expect(analyser(maisons.debutant).aRanger.map((e) => e.id)).toEqual(["switch.prise_connectee"]);
  });
});

describe("Météo-France", () => {
  it.each(["debutant", "famille"])("maison %s : la pluie et la vigilance sont trouvées, même la pluie qui est un capteur d'horodatage", (nom) => {
    const m = analyser(maisons[nom]);
    expect(m.meteoFrance).toMatch(/_next_rain$/);
    expect(m.vigilance).toMatch(/_weather_alert$/);
    expect(m.meteo).toMatch(/^weather\.meteo_france/);
  });

  it("ses capteurs ne comptent pas comme des appareils et ne vont jamais « à ranger »", () => {
    const m = analyser(maisons.debutant);
    expect(m.mode).toBe("decouverte");
    expect(m.utiles.some((e) => e.plateforme === "meteo_france")).toBe(false);
    expect(m.aRanger.some((e) => e.plateforme === "meteo_france")).toBe(false);
  });

  it("maison complète, sans Météo-France : rien n'est inventé", () => {
    const m = analyser(maisons.complete);
    expect(m.meteoFrance).toBeNull();
    expect(m.vigilance).toBeNull();
  });
});

describe("en ce moment", () => {
  const m = analyser(maisons.famille);

  it("les lecteurs rangés, sans les groupes", () => {
    expect(m.medias.map((e) => e.id)).toEqual(["media_player.enceinte_du_salon"]);
  });

  it("les personnes, même écartées du tri (la carte garde celles qui ont un traceur)", () => {
    expect(m.personnes).toEqual(expect.arrayContaining(["person.antonin_essai", "person.camille"]));
  });

  it("l'agenda de la maison, jamais celui des jours fériés", () => {
    expect(m.agendas).toContain("calendar.maison");
    for (const id of m.agendas) expect(m.toutes.find((e) => e.id === id)?.plateforme).not.toBe("holiday");
  });

  it("les machines qui peuvent tourner et la liste de courses", () => {
    expect(m.enMarche).toEqual(expect.arrayContaining(["binary_sensor.lave_linge", "vacuum.demo_vacuum_0_ground_floor"]));
    expect(m.enMarche).not.toContain("vacuum.demo_vacuum_1_first_floor"); // masqué par l'utilisateur
    expect(m.courses).toBe("todo.shopping_list");
  });
});
