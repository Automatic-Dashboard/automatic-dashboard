// Les valeurs vivantes, lues à chaque rendu dans `hass.states` (le tri, lui, ne change pas).

import type { HomeAssistant } from "../ha";
import { t, valide } from "../outils";
import { reglagesEnergie } from "../donnees/energie";
import { chauffe } from "./conseils";
import type { Maison } from "./types";

/** Première valeur numérique disponible parmi des candidats ordonnés. */
// Les seuils du tableau sont écrits en °C. Chaque mesure est convertie selon l'unité de son
// capteur (ou de la météo) : passer la maison en °F laisse les capteurs existants en °C.

/** L'unité d'une température : celle de l'entité, sinon celle choisie pour la maison. */
function uniteTemperature(hass: HomeAssistant | undefined, id?: string): string | undefined {
  const a = id ? hass?.states?.[id]?.attributes : undefined;
  return (a?.unit_of_measurement as string | undefined) ?? (a?.temperature_unit as string | undefined) ?? hass?.config?.unit_system?.temperature;
}
/** Une température en °C, pour la comparer aux seuils ; l'unité est celle de l'entité donnée, sinon celle de la maison. */
export const enCelsius = (hass: HomeAssistant | undefined, v: number, id?: string): number =>
  uniteTemperature(hass, id) === "°F" ? ((v - 32) * 5) / 9 : v;
/** Un seuil écrit en °C, dans l'unité des mesures affichées (celle de l'entité donnée, sinon de la maison). */
export const depuisCelsius = (hass: HomeAssistant | undefined, c: number, id?: string): number =>
  uniteTemperature(hass, id) === "°F" ? (c * 9) / 5 + 32 : c;
/** La première température valide d'une liste de capteurs, en °C. */
export function premiereTemperatureC(hass: HomeAssistant, candidats: string[] | undefined): number | null {
  for (const id of candidats ?? []) {
    const v = Number.parseFloat(hass.states[id]?.state ?? "");
    if (!Number.isNaN(v)) return enCelsius(hass, v, id);
  }
  return null;
}

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
/** La température dehors en °C : le capteur extérieur, sinon la météo, chacun dans son unité. */
export function temperatureDehorsC(hass: HomeAssistant, m: Maison): number | null {
  const capteur = premiereTemperatureC(hass, m.temperaturesExterieures);
  if (capteur !== null) return capteur;
  const v = temperatureDehors(hass, m);
  return v === null ? null : enCelsius(hass, v, m.meteo ?? undefined);
}

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
  // Les compteurs déclarés dans les réglages Énergie de Home Assistant l'emportent toujours.
  const declares = reglagesEnergie()?.reseau ?? [];
  if (declares.length) return declares;
  const reseau = m.puissanceReseau ? hass.entities[m.puissanceReseau]?.device_id : null;
  const energies = m.energie.filter((e) => e.classe === "energy");
  if (reseau) {
    const duCompteur = energies.filter((e) => e.appareil === reseau);
    if (duCompteur.length) return duCompteur.map((e) => e.id);
  }
  const maison = energies.find((e) => !e.piece && /maison|home|total|linky|compteur|index|r(é|e)seau|grid/i.test(e.etat.attributes.friendly_name ?? ""));
  return maison ? [maison.id] : [];
}

/** « 2 chauffages et 1 clim en marche » : ce que font les appareils de climat allumés. */
export function enMarcheClimat(hass: HomeAssistant, m: Maison): string {
  const actifs = m.climats.filter((e) => !["off", "unavailable", "unknown"].includes(hass.states[e.id]?.state ?? "off"));
  if (!actifs.length) return "";
  const etat = (id: string) => hass.states[id];
  const froid = (id: string) => etat(id)?.attributes.hvac_action === "cooling" || (!etat(id)?.attributes.hvac_action && etat(id)?.state === "cool");
  const chauffages = actifs.filter((e) => e.domaine === "water_heater" || (e.domaine === "climate" && chauffe(etat(e.id)))).length;
  const clims = actifs.filter((e) => e.domaine === "climate" && froid(e.id)).length;
  const autres = actifs.length - chauffages - clims;
  const pluriel = (n: number, un: string, plusieurs: string) => (n ? `${n} ${n > 1 ? plusieurs : un}` : "");
  const tx = t(hass), mots = tx.motsEnMarche;
  const parties = [pluriel(chauffages, mots.chauffage[0], mots.chauffage[1]), pluriel(clims, mots.clim[0], mots.clim[1]), pluriel(autres, mots.appareil[0], mots.appareil[1])];
  const liste = parties.filter(Boolean);
  const texte = liste.length > 1 ? `${liste.slice(0, -1).join(", ")}${tx.et}${liste.at(-1)}` : liste[0];
  return tx.enMarche(texte);
}
