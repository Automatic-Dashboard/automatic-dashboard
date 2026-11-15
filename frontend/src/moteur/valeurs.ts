// Les valeurs vivantes, lues à chaque rendu dans `hass.states` (le tri, lui, ne change pas).

import type { HomeAssistant } from "../ha";
import { valide } from "../outils";
import type { Maison } from "./types";

/** Première valeur numérique disponible parmi des candidats ordonnés. */
export function premiereValeur(hass: HomeAssistant, candidats: string[] | undefined): number | null {
  for (const id of candidats ?? []) {
    const v = Number.parseFloat(hass.states[id]?.state ?? "");
    if (!Number.isNaN(v)) return v;
  }
  return null;
}

export function moyenneInterieure(hass: HomeAssistant, m: Maison): number | null {
  const valeurs = m.temperaturesInterieures.map((c) => premiereValeur(hass, c)).filter((v): v is number => v !== null);
  return valeurs.length ? valeurs.reduce((a, b) => a + b, 0) / valeurs.length : null;
}

export function humiditeInterieure(hass: HomeAssistant, m: Maison): number | null {
  const valeurs = m.pieces.filter((p) => !p.exterieur && !p.annexe).map((p) => premiereValeur(hass, p.humidites))
    .filter((v): v is number => v !== null);
  return valeurs.length ? valeurs.reduce((a, b) => a + b, 0) / valeurs.length : null;
}

/** Dehors : un capteur d'une pièce extérieure, sinon la météo. */
export function temperatureDehors(hass: HomeAssistant, m: Maison): number | null {
  const capteur = premiereValeur(hass, m.temperaturesExterieures);
  if (capteur !== null) return capteur;
  const meteo = m.meteo ? hass.states[m.meteo] : undefined;
  return valide(meteo) && typeof meteo.attributes.temperature === "number" ? meteo.attributes.temperature : null;
}

/**
 * Les compteurs d'énergie de toute la maison : ceux de l'appareil qui donne la puissance
 * du réseau, sinon le capteur d'énergie sans pièce dont le nom évoque la maison.
 * Jamais la somme des prises.
 */
export function energiesMaison(hass: HomeAssistant, m: Maison): string[] {
  const reseau = m.puissanceReseau ? hass.entities[m.puissanceReseau]?.device_id : null;
  const energies = m.energie.filter((e) => e.classe === "energy");
  if (reseau) {
    const duCompteur = energies.filter((e) => e.appareil === reseau);
    if (duCompteur.length) return duCompteur.map((e) => e.id);
  }
  const maison = energies.find((e) => !e.piece && /maison|home|total|linky|compteur|index|r(é|e)seau|grid/i.test(e.etat.attributes.friendly_name ?? ""));
  return maison ? [maison.id] : [];
}
