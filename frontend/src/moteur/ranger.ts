// « À ranger » propose la pièce : « Lampe du salon » sans pièce donne « Salon ? ».
// D'abord le nom d'une pièce (ou l'un de ses alias) écrit dans le nom de l'appareil, le plus
// long l'emportant (« Chambre des enfants » avant « Chambre ») ; sinon le type de pièce,
// dans les deux langues (« Bedroom lamp » donne la seule chambre de la maison).

import type { PieceHA } from "../ha";
import { ICONES_PIECES } from "./regles";

/** Minuscules, sans accents : « Entrée » et « entree » se valent. */
export const normaliser = (s: string): string => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

const echapper = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Le mot (ou groupe de mots) apparaît-il en entier dans le nom ? */
const contient = (nom: string, mot: string) =>
  mot.length >= 2 && new RegExp(`(^|[^\\p{L}\\p{N}])${echapper(mot)}($|[^\\p{L}\\p{N}])`, "u").test(nom);

/** La pièce proposée pour un nom d'appareil, ou null si rien n'est sûr. */
export function proposerPiece(nom: string | null | undefined, pieces: (PieceHA & { aliases?: string[] })[]): string | null {
  if (!nom || !pieces.length) return null;
  const n = normaliser(nom);
  // 1. Le nom (ou un alias) d'une pièce, écrit tel quel : le plus long gagne.
  let meilleure: { id: string; longueur: number } | null = null;
  for (const p of pieces) {
    for (const nomPiece of [p.name, ...(p.aliases ?? [])]) {
      const m = normaliser(nomPiece ?? "");
      if (contient(n, m) && (!meilleure || m.length > meilleure.longueur)) meilleure = { id: p.area_id, longueur: m.length };
    }
  }
  if (meilleure) return meilleure.id;
  // 2. Le type de pièce, en français ou en anglais, s'il désigne une seule pièce de la maison.
  for (const [source] of ICONES_PIECES) {
    // En mots entiers : « Salonnière » n'est pas un salon.
    const motif = new RegExp(`(^|[^\\p{L}])(?:${source.source})($|[^\\p{L}])`, "iu");
    if (!motif.test(nom)) continue;
    const candidates = pieces.filter((p) => motif.test(p.name) || (p.aliases ?? []).some((a) => motif.test(a)));
    if (candidates.length === 1) return candidates[0].area_id;
  }
  return null;
}
