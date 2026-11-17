// La page d'accueil, dans ses trois densités.

import type { HomeAssistant } from "../ha";
import { avecLargeurs } from "../mise-en-page/rangees";
import type { Maison, Reglages } from "../moteur/types";
import { estFrancais, t } from "../outils";
import { type CarteConfig, section, titre, tuile, vue, type VueConfig } from "./configs";
import { lireFavorisPerso } from "../donnees/favoris";

type AvecReglages = (c: CarteConfig) => CarteConfig;

/** Les commandes habituelles prédites par Home Assistant, sinon une lumière par pièce de vie, puis les thermostats. */
export async function favorisAutomatiques(hass: HomeAssistant, m: Maison): Promise<string[]> {
  // Jamais une entité masquée dans les réglages ou écartée du tri (la prédiction ne les connaît pas),
  // et seulement ce qui se commande : la météo ou un capteur ont déjà leur place ailleurs.
  const commandes = new Set(m.gardees.filter((e) => e.role === "commande").map((e) => e.id));
  const garder = (ids: string[]) => ids.filter((id) => hass.states[id] && commandes.has(id));
  let favoris: string[] = [];
  try {
    const r = await hass.callWS<{ entities?: string[] }>({ type: "usage_prediction/common_control" });
    favoris = garder(r?.entities ?? []);
  } catch {
    // Pas de prédiction : on choisit nous-mêmes.
  }
  // Rien d'utilisable dans la prédiction : une lumière par pièce de vie, puis les thermostats.
  if (!favoris.length) {
    favoris = garder([
      ...m.pieces.filter((p) => !p.exterieur && !p.annexe)
        .map((p) => p.entites.find((e) => e.domaine === "light" && e.principale) ?? p.entites.find((e) => e.domaine === "light"))
        .filter((e) => e !== undefined).map((e) => e.id),
      ...m.climats.filter((e) => e.piece).map((e) => e.id),
    ]);
  }
  return favoris;
}

/**
 * Favoris : les épinglés d'abord, dans l'ordre de l'utilisateur, puis (sauf si on
 * l'a refusé) les commandes habituelles, pour remplir les rangées : 4 ou 8 tuiles.
 * Au-delà de 8 épinglés, on les montre tous, sans rien ajouter.
 */
/** Les favoris de la personne connectée : les siens s'il en a choisi, sinon ceux épinglés dans le tableau. */
export async function favorisDeLaPersonne(hass: HomeAssistant, m: Maison, reglages: Reglages = {}): Promise<string[]> {
  const perso = await lireFavorisPerso(hass);
  return choisirFavoris(hass, m, perso.length ? { ...reglages, favoris: perso } : reglages);
}

export async function choisirFavoris(hass: HomeAssistant, m: Maison, reglages: Reglages = {}): Promise<string[]> {
  // Les épinglés des réglages d'abord, dans leur ordre, puis ceux posés par étiquette.
  const epingles = [...new Set([...(reglages.favoris ?? []), ...m.favorisEtiquette])].filter((id) => hass.states[id]);
  if (m.mode === "decouverte") return [];
  if (reglages.completer === false) return epingles;
  const autres = (await favorisAutomatiques(hass, m)).filter((id) => !epingles.includes(id));
  return [...epingles, ...autres].slice(0, nombreDeFavoris(epingles.length, autres.length));
}

/** Combien de tuiles de favoris : 4 ou 8 pour des rangées pleines, ou tous les épinglés au-delà de 8. */
export const nombreDeFavoris = (epingles: number, autres: number): number =>
  epingles > 8 ? epingles : Math.max(epingles, epingles + autres >= 8 ? 8 : 4);

/**
 * La carte météo native affiche le nom de l'entité, parfois long et en anglais
 * (« Météo-France forecast for city… ») : on lui donne celui de la maison.
 */
const nomMeteo = (hass: HomeAssistant): Record<string, string> => (hass.config.location_name ? { name: hass.config.location_name } : {});

/** Pluie dans l'heure et vigilance, s'il y a Météo-France (la carte se masque sans donnée). */
const meteoFrance = (m: Maison, avecReglages: AvecReglages, colonnes: number | "full"): CarteConfig[] =>
  (m.meteoFrance || m.vigilance ? [avecReglages({ type: "custom:automatic-dashboard-meteo-france", grid_options: { columns: colonnes, rows: "auto" } })] : []);

/** « En ce moment » : médias, présence, agenda, machines, courses (la carte se masque si rien ne se passe). */
const enCeMoment = (avecReglages: AvecReglages): CarteConfig =>
  avecReglages({ type: "custom:automatic-dashboard-moment", grid_options: { columns: 12, rows: "auto" } });

/** Le côté de l'accueil : météo, aperçus du climat et de l'énergie, en ce moment, éphéméride. */
function contexteMaison(hass: HomeAssistant, m: Maison, avecReglages: AvecReglages): CarteConfig[] {
  const cote: CarteConfig[] = [];
  if (m.meteo) {
    cote.push({ type: "weather-forecast", entity: m.meteo, ...nomMeteo(hass), forecast_type: "hourly", show_current: true, show_forecast: true,
      grid_options: { columns: 12, rows: 4 } });
  }
  cote.push(...meteoFrance(m, avecReglages, 12));
  const apercus: CarteConfig[] = [];
  if (m.temperaturesInterieures.length) apercus.push(avecReglages({ type: "custom:automatic-dashboard-apercu", sorte: "climat" }));
  if (m.puissanceReseau) apercus.push(avecReglages({ type: "custom:automatic-dashboard-apercu", sorte: "energie" }));
  cote.push(...apercus.map((c) => ({ ...c, grid_options: { columns: apercus.length === 1 ? 12 : 6, rows: 2 } })));
  cote.push(enCeMoment(avecReglages));
  cote.push(avecReglages({ type: "custom:automatic-dashboard-apercu", sorte: "ephemeride", grid_options: { columns: 12, rows: 2 } }));
  return cote;
}

/** Accueil des modes Maison et Complet. */
export function accueilMaison(hass: HomeAssistant, m: Maison, avecReglages: AvecReglages, pastilles: CarteConfig[], favoris: string[]): VueConfig {
  const tx = t(hass);
  const piece = (id: string) => avecReglages({ type: "custom:automatic-dashboard-piece", piece: id });
  const scene = [section([avecReglages({ type: "custom:automatic-dashboard-points" })])];
  // Les favoris : la tuile Automatic Dashboard (nom sur deux lignes) ou celle de Home Assistant, au choix.
  const favori = (id: string): CarteConfig => (m.reglages.tuiles === "home_assistant"
    ? { type: "tile", entity: id } : avecReglages({ type: "custom:automatic-dashboard-favori", entity: id }));
  // « Mes favoris » : chacun choisit les siens, depuis le titre de la rangée.
  const mesFavoris = { badges: [{ type: "button", text: tx.modifierFavoris, icon: "mdi:star-cog-outline",
    tap_action: { action: "navigate", navigation_path: "mes-favoris" } }] };
  if (favoris.length) scene.push(section([titre(tx.favoris, mesFavoris), ...favoris.map(favori)]));

  const pieces = m.pieces.filter((p) => p.utiles > 0);
  if (m.mode === "complet" && m.etages.length > 1) {
    // Complet : une section par étage, pièces en Petit 4×2 par trois.
    for (const etage of m.etages) {
      const liste = pieces.filter((p) => p.etage === etage.floor_id);
      if (!liste.length) continue;
      scene.push(section([titre(etage.name, { icon: etage.icon || undefined }), ...avecLargeurs(liste.map((p) => piece(p.area_id)), 4, "promotion", 2)]));
    }
    const autres = pieces.filter((p) => !p.etage);
    if (autres.length) {
      scene.push(section([titre(estFrancais(hass) ? "Autres pièces" : "Other rooms"), ...avecLargeurs(autres.map((p) => piece(p.area_id)), 4, "promotion", 2)]));
    }
  } else if (m.mode === "complet" && pieces.length) {
    // Complet sans étages : une seule section, pièces en Petit 4×2 par trois.
    scene.push(section([titre(tx.pieces), ...avecLargeurs(pieces.map((p) => piece(p.area_id)), 4, "promotion", 2)]));
  } else if (pieces.length) {
    // Maison : Moyen 6×2, la pièce la plus équipée promue en double largeur.
    const ordre = [...pieces];
    if (ordre.length % 2 === 1) {
      const plus = ordre.reduce((a, b) => (b.utiles > a.utiles ? b : a));
      ordre.splice(ordre.indexOf(plus), 1);
      ordre.unshift(plus);
    }
    scene.push(section([titre(tx.pieces), ...avecLargeurs(ordre.map((p) => piece(p.area_id)), 6, "promotion", 2)]));
  }
  if (m.aRanger.length) {
    scene.push(section([avecReglages({ type: "custom:automatic-dashboard-apercu", sorte: "a-ranger", grid_options: { columns: "full", rows: 2 } })]));
  }
  return vue({
    path: "accueil", title: tx.accueil, icon: "mdi:home-roof", badges: pastilles,
    ouverture: avecReglages({ type: "custom:automatic-dashboard-ouverture", page: "accueil" }),
    scene, cote: contexteMaison(hass, m, avecReglages), coteApres: 1,
  });
}

/** Accueil du mode Découverte : la météo en grand, chaque appareil en grand, les premiers pas. */
export function accueilDecouverte(hass: HomeAssistant, m: Maison, avecReglages: AvecReglages, pastilles: CarteConfig[]): VueConfig {
  const tx = t(hass);
  const scene = [];
  if (m.meteo) {
    scene.push(section([{ type: "weather-forecast", entity: m.meteo, ...nomMeteo(hass), forecast_type: "hourly", show_current: true, show_forecast: true,
      forecast_slots: 9, grid_options: { columns: "full", rows: 4 } }, ...meteoFrance(m, avecReglages, "full")]));
  }
  scene.push(section([avecReglages({ type: "custom:automatic-dashboard-points" })]));
  const appareils = m.utiles.filter((e) => e.principale || !e.appareil);
  if (appareils.length) {
    const tuiles = appareils.slice(0, 6).map((e) => tuile(e, "maison", { vertical: false }));
    const ranger = m.aRanger.length
      ? [avecReglages({ type: "custom:automatic-dashboard-apercu", sorte: "a-ranger", grid_options: { columns: "full", rows: 2 } })] : [];
    scene.push(section([titre(tx.votreMaison), ...avecLargeurs(tuiles, 6, "promotion", 2), ...ranger]));
  }
  scene.push(section([avecReglages({ type: "custom:automatic-dashboard-premiers-pas", grid_options: { columns: "full", rows: "auto" } })]));

  const cote: CarteConfig[] = [];
  if (m.meteo) {
    cote.push({ type: "weather-forecast", entity: m.meteo, ...nomMeteo(hass), forecast_type: "daily", show_current: false, show_forecast: true,
      grid_options: { columns: 12, rows: 4 } });
  }
  cote.push(enCeMoment(avecReglages));
  cote.push(avecReglages({ type: "custom:automatic-dashboard-apercu", sorte: "ephemeride", grid_options: { columns: 12, rows: 2 } }));

  return vue({
    path: "accueil", title: tx.accueil, icon: "mdi:home-roof", badges: pastilles,
    ouverture: avecReglages({ type: "custom:automatic-dashboard-ouverture", page: "accueil" }),
    scene, cote, coteApres: 1,
  });
}
