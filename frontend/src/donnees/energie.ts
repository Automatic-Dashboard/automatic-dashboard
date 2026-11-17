// Les réglages Énergie de Home Assistant (Paramètres, Tableaux de bord, Énergie) : les
// compteurs que l'utilisateur a déclarés lui-même, avec leurs prix. Quand ils existent,
// ils l'emportent sur ce que le tri devine d'après les noms. Lus une fois par heure.

import type { HomeAssistant } from "../ha";

export interface ReglagesEnergie {
  /** Ce qui vient du réseau (kWh), compteur par compteur. */
  reseau: string[];
  /** Ce qui repart vers le réseau (revente). */
  retour: string[];
  solaire: string[];
  gaz: string[];
  eau: string[];
  /** Les coûts de l'électricité achetée (statistiques en monnaie). */
  couts: string[];
  /** Les appareils suivis un par un. */
  appareils: string[];
  /** La puissance du réseau (W ou kW), si elle est déclarée. */
  puissance: string[];
}

interface Flux {
  stat_energy_from?: string;
  stat_energy_to?: string;
  stat_cost?: string | null;
}
interface Source {
  type: string;
  stat_energy_from?: string | null;
  stat_energy_to?: string | null;
  stat_cost?: string | null;
  stat_rate?: string;
  flow_from?: Flux[];
  flow_to?: Flux[];
}
interface Prefs {
  energy_sources?: Source[];
  device_consumption?: { stat_consumption?: string }[];
}

let memoire: { quand: number; valeur: ReglagesEnergie | null } | null = null;
let enCours: Promise<ReglagesEnergie | null> | null = null;

/** Ce que les réglages Énergie disent de la maison (null s'ils ne sont pas faits). */
export function lireReglagesEnergie(prefs: Prefs | null | undefined, couts: Record<string, string> = {}): ReglagesEnergie | null {
  const sources = prefs?.energy_sources ?? [];
  if (!sources.length) return null;
  const r: ReglagesEnergie = { reseau: [], retour: [], solaire: [], gaz: [], eau: [], couts: [], appareils: [], puissance: [] };
  // Le coût : la statistique choisie par l'utilisateur, ou celle que Home Assistant calcule d'après le prix.
  const achat = (stat: string, cout?: string | null) => {
    r.reseau.push(stat);
    const c = cout || couts[stat];
    if (c) r.couts.push(c);
  };
  for (const s of sources) {
    if (s.type === "grid") {
      // Home Assistant 2026 : une source réseau par compteur, avec son prix et sa puissance.
      if (s.stat_energy_from) achat(s.stat_energy_from, s.stat_cost);
      if (s.stat_energy_to) r.retour.push(s.stat_energy_to);
      if (s.stat_rate) r.puissance.push(s.stat_rate);
      // L'ancienne forme : des listes de compteurs d'achat et de revente.
      for (const f of s.flow_from ?? []) if (f.stat_energy_from) achat(f.stat_energy_from, f.stat_cost);
      for (const f of s.flow_to ?? []) if (f.stat_energy_to) r.retour.push(f.stat_energy_to);
    } else if (s.type === "solar" && s.stat_energy_from) r.solaire.push(s.stat_energy_from);
    else if (s.type === "gas" && s.stat_energy_from) r.gaz.push(s.stat_energy_from);
    else if (s.type === "water" && s.stat_energy_from) r.eau.push(s.stat_energy_from);
  }
  r.appareils = (prefs?.device_consumption ?? []).map((d) => d.stat_consumption).filter((x): x is string => Boolean(x));
  return r;
}

/** Charge les réglages Énergie (une fois par heure). La stratégie l'attend avant de construire le tableau. */
export function chargerReglagesEnergie(hass: HomeAssistant): Promise<ReglagesEnergie | null> {
  if (memoire && Date.now() - memoire.quand < 3600000) return Promise.resolve(memoire.valeur);
  enCours ??= Promise.all([
    hass.callWS<Prefs>({ type: "energy/get_prefs" }).catch(() => null),
    hass.callWS<{ cost_sensors?: Record<string, string> }>({ type: "energy/info" }).catch(() => null),
  ]).then(([prefs, info]) => {
    const valeur = lireReglagesEnergie(prefs, info?.cost_sensors ?? {});
    memoire = { quand: Date.now(), valeur };
    enCours = null;
    return valeur;
  });
  return enCours;
}

/** Les réglages Énergie déjà chargés (null s'ils ne le sont pas, ou s'ils ne sont pas faits). */
export const reglagesEnergie = (): ReglagesEnergie | null => memoire?.valeur ?? null;

/** Pour les tests. */
export const poserReglagesEnergie = (valeur: ReglagesEnergie | null): void => {
  memoire = valeur === null ? null : { quand: Date.now(), valeur };
};
