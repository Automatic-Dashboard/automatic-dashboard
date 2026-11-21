// Les données du passé, demandées à Home Assistant par WebSocket : l'historique de
// 24 h des mini-courbes et la variation d'un compteur d'énergie sur une journée.

import type { HomeAssistant } from "../ha";

/** Une valeur par tranche de temps, `null` tant qu'aucune mesure n'est connue. */
export type Serie = (number | null)[];

/** Un point d'historique au format compact de Home Assistant (secondes depuis 1970). */
interface PointHistorique {
  s: unknown;
  lu?: number;
  lc?: number;
}

interface PointStatistique {
  start: number;
  mean?: number | null;
}

const TRANCHES = 32;
const JOUR = 24 * 3600000;

/* Historique de 24 h, demandé une fois par sujet et gardé 15 minutes : les copies
   d'une même carte (côté, tablette, téléphone) partagent la même requête. */
const historiques = new Map<string, { quand: number; promesse: Promise<Serie> }>();

export function historique(hass: HomeAssistant, cle: string, ids: string[]): Promise<Serie> {
  const deja = historiques.get(cle);
  if (deja && Date.now() - deja.quand < 15 * 60000) return deja.promesse;
  const debut = new Date(Date.now() - JOUR).toISOString();
  // D'abord les statistiques à 5 minutes (légères : 288 points par jour et par capteur),
  // sinon l'historique brut, pour les capteurs sans statistiques.
  const promesse = hass.callWS<Record<string, PointStatistique[]>>({
    type: "recorder/statistics_during_period", start_time: debut, statistic_ids: ids, period: "5minute", types: ["mean"],
  })
    .then((stats) => {
      const listes: Record<string, PointHistorique[]> = Object.fromEntries(Object.entries(stats ?? {}).filter(([, l]) => l.length > 1)
        .map(([id, l]) => [id, l.map((p) => ({ s: p.mean, lu: p.start > 1e12 ? p.start / 1000 : p.start }))]));
      if (Object.keys(listes).length) return listes;
      return hass.callWS<Record<string, PointHistorique[]>>({
        type: "history/history_during_period", start_time: debut, entity_ids: ids, minimal_response: true,
        no_attributes: true, significant_changes_only: false,
      });
    })
    .then((r) => enTranches(r))
    .catch((): Serie => []);
  historiques.set(cle, { quand: Date.now(), promesse });
  return promesse;
}

/** 32 tranches entre le premier point connu (24 h au plus, 2 h au moins) et maintenant : moyenne de toutes les séries. */
function enTranches(r: Record<string, PointHistorique[]> | null | undefined): Serie {
  const maintenant = Date.now();
  const listes = Object.values(r ?? {});
  const premiers = listes.flatMap((l) => (l.length ? [(l[0].lu ?? l[0].lc ?? 0) * 1000] : []));
  const origine = Math.min(Math.max(Math.min(...premiers, maintenant), maintenant - JOUR), maintenant - 2 * 3600000);
  const pas = (maintenant - origine) / TRANCHES;
  const tranches: number[][] = Array.from({ length: TRANCHES }, () => []);
  for (const liste of listes) {
    // Un capteur qui ne change pas garde sa valeur dans les tranches suivantes.
    let dernier: { i: number; v: number } | null = null;
    for (const p of liste) {
      const v = Number.parseFloat(String(p.s));
      const quand = (p.lu ?? p.lc ?? 0) * 1000;
      if (Number.isNaN(v)) continue;
      const i = Math.max(0, Math.min(TRANCHES - 1, Math.floor((quand - origine) / pas)));
      if (dernier) for (let k = dernier.i + 1; k < i; k++) tranches[k].push(dernier.v);
      tranches[i].push(v);
      dernier = { i, v };
    }
    if (dernier) for (let k = dernier.i + 1; k < TRANCHES; k++) tranches[k].push(dernier.v);
  }
  let precedent: number | null = null;
  return tranches.map((l) => (l.length ? (precedent = l.reduce((a, b) => a + b, 0) / l.length) : precedent));
}

const statistiques = new Map<string, { quand: number; promesse: Promise<number | null> }>();

/**
 * Variation d'un compteur d'énergie sur la journée (ou la veille, `decalage` -1), par les statistiques,
 * toujours en kWh : des compteurs en Wh et en kWh s'additionnent sans erreur.
 */
export function variationJour(hass: HomeAssistant, ids: string[], decalage = 0): Promise<number | null> {
  const cle = `${ids.join()}|${decalage}`;
  const deja = statistiques.get(cle);
  if (deja && Date.now() - deja.quand < 5 * 60000) return deja.promesse;
  const promesse = Promise.all(ids.map((id) => hass.callWS<{ change?: number | null } | null>({
    type: "recorder/statistic_during_period", statistic_id: id, calendar: { period: "day", offset: decalage }, types: ["change"],
    units: { energy: "kWh" },
  }).then((r) => r?.change ?? null).catch(() => null)))
    .then((valeurs) => (valeurs.every((v) => v === null) ? null : valeurs.reduce<number>((a, b) => a + (b || 0), 0)));
  statistiques.set(cle, { quand: Date.now(), promesse });
  return promesse;
}
