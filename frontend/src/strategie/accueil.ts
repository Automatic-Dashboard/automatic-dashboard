// La page d'accueil, dans ses trois densités.

import type { HomeAssistant } from "../ha";
import { avecLargeurs } from "../mise-en-page/rangees";
import type { Maison } from "../moteur/types";
import { estFrancais, t } from "../outils";
import { type CarteConfig, section, titre, tuile, vue, type VueConfig } from "./configs";

type AvecReglages = (c: CarteConfig) => CarteConfig;

/**
 * Favoris : les commandes habituelles prédites par Home Assistant, sinon une lumière
 * par pièce de vie, puis les thermostats. 4 ou 8, pour des rangées pleines.
 */
export async function choisirFavoris(hass: HomeAssistant, m: Maison, demandes: string[] = []): Promise<string[]> {
  if (demandes.length) return demandes.filter((id) => hass.states[id]);
  if (m.mode === "decouverte") return [];
  let favoris: string[] = [];
  try {
    const r = await hass.callWS<{ entities?: string[] }>({ type: "usage_prediction/common_control" });
    favoris = (r?.entities ?? []).filter((id) => hass.states[id]);
  } catch {
    // Pas de prédiction : on choisit nous-mêmes.
  }
  if (!favoris.length) {
    favoris = [
      ...m.pieces.filter((p) => !p.exterieur && !p.annexe)
        .map((p) => p.entites.find((e) => e.domaine === "light" && e.principale) ?? p.entites.find((e) => e.domaine === "light"))
        .filter((e) => e !== undefined).map((e) => e.id),
      ...m.climats.filter((e) => e.piece).map((e) => e.id),
    ];
  }
  return favoris.slice(0, favoris.length >= 8 ? 8 : 4);
}

/** Le côté de l'accueil : météo, aperçus du climat et de l'énergie, éphéméride. */
function contexteMaison(m: Maison, avecReglages: AvecReglages): CarteConfig[] {
  const cote: CarteConfig[] = [];
  if (m.meteo) {
    cote.push({ type: "weather-forecast", entity: m.meteo, forecast_type: "hourly", show_current: true, show_forecast: true,
      grid_options: { columns: 12, rows: 4 } });
  }
  const apercus: CarteConfig[] = [];
  if (m.temperaturesInterieures.length) apercus.push(avecReglages({ type: "custom:centralhome-apercu", sorte: "climat" }));
  if (m.puissanceReseau) apercus.push(avecReglages({ type: "custom:centralhome-apercu", sorte: "energie" }));
  cote.push(...apercus.map((c) => ({ ...c, grid_options: { columns: apercus.length === 1 ? 12 : 6, rows: 2 } })));
  cote.push(avecReglages({ type: "custom:centralhome-apercu", sorte: "ephemeride", grid_options: { columns: 12, rows: 2 } }));
  return cote;
}

/** Accueil des modes Maison et Complet. */
export function accueilMaison(hass: HomeAssistant, m: Maison, avecReglages: AvecReglages, pastilles: CarteConfig[], favoris: string[]): VueConfig {
  const tx = t(hass);
  const piece = (id: string) => avecReglages({ type: "custom:centralhome-piece", piece: id });
  const scene = [section([avecReglages({ type: "custom:centralhome-points" })])];
  if (favoris.length) scene.push(section([titre(tx.favoris), ...favoris.map((id) => ({ type: "tile", entity: id }))]));

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
    scene.push(section([avecReglages({ type: "custom:centralhome-apercu", sorte: "a-ranger", grid_options: { columns: "full", rows: 2 } })]));
  }
  return vue({
    path: "accueil", title: tx.accueil, icon: "mdi:home-roof", badges: pastilles,
    ouverture: avecReglages({ type: "custom:centralhome-ouverture", page: "accueil" }),
    scene, cote: contexteMaison(m, avecReglages), coteApres: 1,
  });
}

/** Accueil du mode Découverte : la météo en grand, chaque appareil en grand, les premiers pas. */
export function accueilDecouverte(hass: HomeAssistant, m: Maison, avecReglages: AvecReglages, pastilles: CarteConfig[]): VueConfig {
  const tx = t(hass);
  const scene = [];
  if (m.meteo) {
    scene.push(section([{ type: "weather-forecast", entity: m.meteo, forecast_type: "hourly", show_current: true, show_forecast: true,
      forecast_slots: 9, grid_options: { columns: "full", rows: 4 } }]));
  }
  scene.push(section([avecReglages({ type: "custom:centralhome-points" })]));
  const appareils = m.utiles.filter((e) => e.principale || !e.appareil);
  if (appareils.length) {
    const tuiles = appareils.slice(0, 6).map((e) => tuile(e, "maison", { vertical: false }));
    const ranger = m.aRanger.length
      ? [avecReglages({ type: "custom:centralhome-apercu", sorte: "a-ranger", grid_options: { columns: "full", rows: 2 } })] : [];
    scene.push(section([titre(tx.votreMaison), ...avecLargeurs(tuiles, 6, "promotion", 2), ...ranger]));
  }
  scene.push(section([avecReglages({ type: "custom:centralhome-premiers-pas", grid_options: { columns: "full", rows: "auto" } })]));

  const cote: CarteConfig[] = [];
  if (m.meteo) {
    cote.push({ type: "weather-forecast", entity: m.meteo, forecast_type: "daily", show_current: false, show_forecast: true,
      grid_options: { columns: 12, rows: 4 } });
  }
  cote.push(avecReglages({ type: "custom:centralhome-apercu", sorte: "ephemeride", grid_options: { columns: 12, rows: 2 } }));
  if (m.vigilance) cote.push({ type: "tile", entity: m.vigilance, grid_options: { columns: 12, rows: 1 } });

  return vue({
    path: "accueil", title: tx.accueil, icon: "mdi:home-roof", badges: pastilles,
    ouverture: avecReglages({ type: "custom:centralhome-ouverture", page: "accueil" }),
    scene, cote, coteApres: 1,
  });
}
