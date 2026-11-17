// Lecture des deux capteurs de Météo-France : la pluie dans l'heure et la vigilance.
// D'après docs/conception/02-mode-decouverte.md, parties 5.3 et 5.4. Fonctions pures :
// jamais d'affirmation sans donnée (un capteur inconnu ne veut pas dire « pas de pluie »).

import type { EtatHA } from "../ha";

/** Une tranche de la prévision : de `debut` à `debut + duree` minutes. */
export interface Tranche {
  debut: number;
  duree: number;
  /** 0 sec, 1 pluie faible, 2 modérée, 3 forte. */
  intensite: 0 | 1 | 2 | 3;
  texte: string;
}

export interface Pluie {
  tranches: Tranche[];
  /** Minutes avant la première tranche de pluie, `null` si l'heure est sèche. */
  dans: number | null;
  /** Intensité de la première pluie. */
  type: string | null;
  /** Il pleut maintenant et ça s'arrête : minutes avant la première tranche sèche. */
  fin: number | null;
  /** Il pleut toute l'heure. */
  continue: boolean;
  /** Heure de la prévision. */
  reference: Date | null;
}

const INTENSITES: Record<string, 0 | 1 | 2 | 3> = { "Temps sec": 0, "Pluie faible": 1, "Pluie modérée": 2, "Pluie forte": 3 };

/**
 * La pluie dans l'heure, d'après l'attribut `1_hour_forecast` (« 0 min » … « 55 min »,
 * par 5 minutes puis par 10). L'état du capteur est « unknown » quand l'heure est sèche :
 * seul l'attribut compte. `null` si le capteur est indisponible ou sans prévision.
 */
export function lirePluie(etat: EtatHA | undefined): Pluie | null {
  if (!etat || etat.state === "unavailable") return null;
  const prevision = etat.attributes["1_hour_forecast"];
  if (!prevision || typeof prevision !== "object") return null;
  const points = Object.entries(prevision as Record<string, unknown>)
    .map(([cle, texte]) => ({ debut: Number.parseInt(cle, 10), texte: String(texte ?? "") }))
    .filter((p) => !Number.isNaN(p.debut))
    .sort((a, b) => a.debut - b.debut);
  if (!points.length) return null;
  const tranches: Tranche[] = points.map((p, i) => ({
    debut: p.debut,
    duree: Math.max(1, (points[i + 1]?.debut ?? 60) - p.debut),
    // Tout autre texte (« Pluie », « Neige »…) compte comme de la pluie.
    intensite: INTENSITES[p.texte] ?? (p.texte ? 1 : 0),
    texte: p.texte,
  }));
  const premiere = tranches.find((t) => t.intensite > 0);
  const pleutMaintenant = tranches[0].intensite > 0;
  const seche = pleutMaintenant ? tranches.find((t) => t.intensite === 0) : undefined;
  const reference = new Date(String(etat.attributes.forecast_time_ref ?? ""));
  return {
    tranches,
    dans: premiere ? premiere.debut : null,
    type: premiere ? premiere.texte : null,
    fin: seche ? seche.debut : null,
    continue: pleutMaintenant && !seche,
    reference: Number.isNaN(reference.getTime()) ? null : reference,
  };
}

/** Les couleurs de vigilance, du vert (0) au rouge (3). */
export const COULEURS_VIGILANCE = ["Vert", "Jaune", "Orange", "Rouge"] as const;

/** Les phénomènes tels que Météo-France les nomme, et leur nom affiché. */
export const PHENOMENES: Record<string, [string, string]> = {
  "Vent violent": ["Vent violent", "Strong wind"],
  "Pluie-inondation": ["Pluie et inondation", "Rain and flooding"],
  Orages: ["Orages", "Thunderstorms"],
  Inondation: ["Crues", "River flooding"],
  "Neige-verglas": ["Neige et verglas", "Snow and ice"],
  Canicule: ["Canicule", "Heatwave"],
  "Grand-froid": ["Grand froid", "Extreme cold"],
  Avalanches: ["Avalanches", "Avalanches"],
  "Vagues-submersion": ["Vagues et submersion", "Waves and coastal flooding"],
};

export interface Vigilance {
  /** 0 vert, 1 jaune, 2 orange, 3 rouge. */
  niveau: 0 | 1 | 2 | 3;
  /** Les phénomènes qui ne sont pas au vert, du plus grave au moins grave. */
  phenomenes: { nom: string; niveau: 1 | 2 | 3 }[];
}

/** La vigilance du département, `null` si elle est inconnue (jamais « pas de vigilance » sans donnée). */
export function lireVigilance(etat: EtatHA | undefined): Vigilance | null {
  const niveau = COULEURS_VIGILANCE.indexOf(etat?.state as (typeof COULEURS_VIGILANCE)[number]);
  if (!etat || niveau < 0) return null;
  const phenomenes = Object.entries(etat.attributes)
    .map(([nom, couleur]) => ({ nom, niveau: COULEURS_VIGILANCE.indexOf(couleur as (typeof COULEURS_VIGILANCE)[number]) }))
    .filter((p): p is { nom: string; niveau: 1 | 2 | 3 } => p.niveau > 0)
    .sort((a, b) => b.niveau - a.niveau);
  return { niveau: niveau as Vigilance["niveau"], phenomenes };
}

/** Le nom affiché d'un phénomène, dans la langue de l'utilisateur. */
export const nomPhenomene = (nom: string, francais: boolean): string => PHENOMENES[nom]?.[francais ? 0 : 1] ?? nom;
