// Le mode absence : la sécurité en tête quand tout le monde est parti, sans toucher à la disposition.

import { describe, expect, it } from "vitest";
import type { HomeAssistant, Instantane } from "../src/ha";
import { analyser } from "../src/moteur/analyser";
import { estAbsent } from "../src/moteur/absence";
import { pointsARegarder } from "../src/moteur/points";
import { genererTableau } from "../src/strategie/strategie";
import famille from "./fixtures/famille.json";

const maison = (modifier: (h: HomeAssistant) => void = () => {}) => {
  const h = {
    ...(structuredClone(famille) as unknown as HomeAssistant), locale: { language: "fr" },
    user: { id: "a", name: "A", is_admin: true }, callWS: async () => ({ entities: [] }) as any,
  } as HomeAssistant;
  modifier(h);
  return { h, m: analyser(h as Instantane) };
};
const partis = (h: HomeAssistant) => {
  for (const s of Object.values(h.states)) if (s.entity_id.startsWith("person.")) s.state = "not_home";
};

describe("qui est à la maison ?", () => {
  it("quelqu'un est là : pas d'absence", () => {
    const { h, m } = maison();
    expect(estAbsent(h, m)).toBe(false);
  });

  it("tout le monde est parti : absence", () => {
    const { h, m } = maison(partis);
    expect(estAbsent(h, m)).toBe(true);
  });

  it("personne n'est suivi : jamais d'absence (on ne sait pas)", () => {
    const { h, m } = maison((x) => {
      partis(x);
      for (const s of Object.values(x.states)) if (s.entity_id.startsWith("person.")) s.attributes.device_trackers = [];
    });
    expect(estAbsent(h, m)).toBe(false);
  });
});

describe("quand tout le monde est parti", () => {
  it("serrures ouvertes, alarme désarmée et lumières allumées passent en tête, en conseils", () => {
    const { h, m } = maison((x) => {
      partis(x);
      x.entities["lock.kitchen_door"] = { entity_id: "lock.kitchen_door", platform: "demo", area_id: "cuisine", labels: [] };
    });
    const points = pointsARegarder(h, m);
    const premiers = points.slice(0, 4).map((p) => p.cle.split(":")[0]);
    expect(premiers).toEqual(expect.arrayContaining(["serrure", "alarme-desarmee"]));
    expect(points.find((p) => p.cle === "serrure:lock.kitchen_door")?.titre).toBe("À verrouiller : Kitchen Door");
    expect(points.find((p) => p.cle.startsWith("alarme-desarmee"))?.titre).toBe("Armez l'alarme");
    const lumieres = points.find((p) => p.cle === "lumieres-absence")!;
    expect(lumieres.titre).toBe("Éteignez les lumières");
    // Les points de sécurité viennent avant les mises à jour et la sauvegarde.
    const rangSecurite = Math.max(...points.map((p, i) => (p.securite ? i : -1)));
    const rangAutre = Math.min(...points.map((p, i) => (!p.securite && p.niveau < 3 ? i : 99)));
    expect(rangSecurite).toBeLessThan(rangAutre);
  });

  it("la disposition ne change pas : mêmes pages, mêmes sections, mêmes cartes", async () => {
    const { h } = maison();
    const { h: absent } = maison(partis);
    const forme = (t: Awaited<ReturnType<typeof genererTableau>>) => JSON.stringify(t.views.map((v) => [v.path,
      (v.sections ?? []).map((s) => s.cards.map((c) => c.type))]));
    expect(forme(await genererTableau({}, absent))).toBe(forme(await genererTableau({}, h)));
  });
});
