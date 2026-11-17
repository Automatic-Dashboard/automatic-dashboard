// Le bilan de la semaine : l'énergie jour par jour (et la semaine d'avant), les températures
// dedans et dehors, et ce qui s'est ouvert. Calculé sur la dernière semaine entière, du lundi
// au dimanche, par les statistiques et l'historique de Home Assistant. Gardé une heure.

import type { HomeAssistant } from "../ha";
import type { Maison } from "../moteur/types";
import { energiesMaison } from "../moteur/valeurs";

const JOUR = 24 * 3600000;

export interface Plage {
  moyenne: number;
  min: number;
  max: number;
}

export interface Bilan {
  debut: Date;
  /** Le lundi suivant, à minuit (exclu). */
  fin: Date;
  energie: { jours: (number | null)[]; total: number; precedent: number | null } | null;
  dedans: Plage | null;
  dehors: Plage | null;
  ouvertures: { total: number; parEntite: [string, number][] } | null;
}

/** La dernière semaine entière : du lundi minuit au lundi minuit, et le lundi d'avant pour comparer. */
export function semainePassee(maintenant = new Date()): { debut: Date; fin: Date; avant: Date } {
  const fin = new Date(maintenant);
  fin.setHours(0, 0, 0, 0);
  fin.setDate(fin.getDate() - ((fin.getDay() + 6) % 7));
  const debut = new Date(fin);
  debut.setDate(debut.getDate() - 7);
  const avant = new Date(fin);
  avant.setDate(avant.getDate() - 14);
  return { debut, fin, avant };
}

const ms = (t: number | string) => (typeof t === "string" ? Date.parse(t) : t > 1e12 ? t : t * 1000);

/** Somme, jour par jour depuis `debut`, des variations de plusieurs compteurs. */
export function sommeParJour(stats: Record<string, { start: number | string; change?: number | null }[]>, debut: Date, jours: number): (number | null)[] {
  const resultat: (number | null)[] = Array.from({ length: jours }, () => null);
  for (const liste of Object.values(stats ?? {})) {
    for (const p of liste) {
      if (p.change === null || p.change === undefined) continue;
      // Arrondi : un jour d'heure d'été ou d'hiver dure 23 ou 25 heures.
      const i = Math.round((ms(p.start) - debut.getTime()) / JOUR);
      if (i >= 0 && i < jours) resultat[i] = (resultat[i] ?? 0) + p.change;
    }
  }
  return resultat;
}

/** Moyenne des moyennes, plus bas des minimums, plus haut des maximums, sur tous les capteurs. */
export function resumerTemperatures(stats: Record<string, { mean?: number | null; min?: number | null; max?: number | null }[]>): Plage | null {
  const points = Object.values(stats ?? {}).flat();
  const moyennes = points.map((p) => p.mean).filter((v): v is number => typeof v === "number");
  if (!moyennes.length) return null;
  const mins = points.map((p) => p.min ?? p.mean).filter((v): v is number => typeof v === "number");
  const maxs = points.map((p) => p.max ?? p.mean).filter((v): v is number => typeof v === "number");
  return { moyenne: moyennes.reduce((a, b) => a + b, 0) / moyennes.length, min: Math.min(...mins), max: Math.max(...maxs) };
}

/** Combien de fois chaque ouverture s'est ouverte : les passages à « on » après le premier état connu. */
export function compterOuvertures(historique: Record<string, { s: unknown }[]>): [string, number][] {
  return Object.entries(historique ?? {})
    .map(([id, liste]): [string, number] => [id, liste.slice(1).filter((p, i) => p.s === "on" && liste[i].s !== "on").length])
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);
}

/** La maison a-t-elle de quoi faire un bilan ? */
export const aUnBilan = (hass: HomeAssistant, m: Maison): boolean =>
  energiesMaison(hass, m).length > 0 || m.temperaturesInterieures.length > 0 || m.ouvrants.length > 0;

const memoire = new Map<string, { quand: number; promesse: Promise<Bilan> }>();

export function chargerBilan(hass: HomeAssistant, m: Maison, maintenant = new Date()): Promise<Bilan> {
  const { debut, fin, avant } = semainePassee(maintenant);
  const energies = energiesMaison(hass, m);
  const dedans = m.temperaturesInterieures.map((c) => c[0]).filter(Boolean);
  const dehors = m.temperaturesExterieures.slice(0, 1);
  const ouvrants = m.ouvrants.slice(0, 40).map((e) => e.id);
  const cle = [debut.getTime(), energies, dedans, dehors, ouvrants].join("|");
  const deja = memoire.get(cle);
  if (deja && Date.now() - deja.quand < 3600000) return deja.promesse;

  const statistiques = <T>(ids: string[], depuis: Date, types: string[]) => (ids.length
    ? hass.callWS<Record<string, T[]>>({ type: "recorder/statistics_during_period", start_time: depuis.toISOString(),
      end_time: fin.toISOString(), statistic_ids: ids, period: "day", types }).catch(() => ({} as Record<string, T[]>))
    : Promise.resolve({} as Record<string, T[]>));

  const promesse = Promise.all([
    statistiques<{ start: number; change?: number | null }>(energies, avant, ["change"]),
    statistiques<{ mean?: number | null; min?: number | null; max?: number | null }>(dedans, debut, ["mean", "min", "max"]),
    statistiques<{ mean?: number | null; min?: number | null; max?: number | null }>(dehors, debut, ["mean", "min", "max"]),
    ouvrants.length
      ? hass.callWS<Record<string, { s: unknown }[]>>({ type: "history/history_during_period", start_time: debut.toISOString(),
        end_time: fin.toISOString(), entity_ids: ouvrants, minimal_response: true, no_attributes: true, significant_changes_only: false })
        .catch(() => null)
      : Promise.resolve(null),
  ]).then(([stEnergie, stDedans, stDehors, histoire]): Bilan => {
    const quatorze = sommeParJour(stEnergie, avant, 14);
    const semaine = quatorze.slice(7);
    const somme = (l: (number | null)[]) => (l.some((v) => v !== null) ? l.reduce<number>((a, b) => a + (b ?? 0), 0) : null);
    const total = somme(semaine);
    const parEntite = histoire ? compterOuvertures(histoire) : [];
    return {
      debut, fin,
      energie: total === null ? null : { jours: semaine, total, precedent: somme(quatorze.slice(0, 7)) },
      dedans: resumerTemperatures(stDedans),
      dehors: resumerTemperatures(stDehors),
      ouvertures: histoire ? { total: parEntite.reduce((a, [, n]) => a + n, 0), parEntite } : null,
    };
  });
  memoire.set(cle, { quand: Date.now(), promesse });
  return promesse;
}
