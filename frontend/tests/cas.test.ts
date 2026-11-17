// Les cas tirés des tickets : chaque fichier de tests/cas est un diagnostic copié depuis
// l'éditeur, complété par ce qui était attendu. Le tri doit donner ce résultat, pour
// toujours : une maison réelle mal rangée une fois ne l'est plus jamais.

/// <reference types="vite/client" />
import { describe, expect, it } from "vitest";
import type { Diagnostic } from "../src/diagnostic";
import type { Instantane } from "../src/ha";
import { analyser } from "../src/moteur/analyser";

type Attendu = Partial<{ ecart: string | null; role: string | null; section: string | null; piece: string | null; aRanger: boolean }>;
interface Cas extends Diagnostic {
  titre: string;
  ticket: string | null;
  attendu: { mode?: string; entites?: Record<string, Attendu> };
}

const fichiers = import.meta.glob<Cas>("./cas/*.json", { eager: true, import: "default" });

describe.each(Object.entries(fichiers))("%s", (_fichier, cas) => {
  const m = analyser(cas.maison as unknown as Instantane, cas.reglages);
  const parId = new Map(m.toutes.map((e) => [e.id, e]));
  const aRanger = new Set(m.aRanger.map((e) => e.id));

  it(cas.titre, () => {
    if (cas.attendu.mode) expect(m.mode).toBe(cas.attendu.mode);
    for (const [id, attendu] of Object.entries(cas.attendu.entites ?? {})) {
      const e = parId.get(id);
      expect(e, `${id} absente du tri`).toBeDefined();
      const obtenu = { ecart: e!.ecart, role: e!.role, section: e!.section, piece: e!.piece, aRanger: aRanger.has(id) };
      expect({ id, ...Object.fromEntries(Object.keys(attendu).map((k) => [k, obtenu[k as keyof Attendu]])) }).toEqual({ id, ...attendu });
    }
  });
});
