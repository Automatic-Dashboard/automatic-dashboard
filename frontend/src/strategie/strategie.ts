// La stratégie de tableau : Home Assistant l'appelle pour fabriquer le tableau, puis
// la rappelle quand les entités, les appareils, les pièces ou les étages changent.

import type { HomeAssistant } from "../ha";
import { analyserMemo } from "../moteur/analyser";
import type { Reglages } from "../moteur/types";
import { accueilDecouverte, accueilMaison, choisirFavoris } from "./accueil";
import type { CarteConfig, VueConfig } from "./configs";
import { sousVues } from "./sous-vues";

/** Réglages saisis dans la configuration du tableau. */
export interface ConfigStrategie extends Reglages {
  type?: string;
  title?: string;
}

export async function genererTableau(config: ConfigStrategie, hass: HomeAssistant): Promise<{ title: string; views: VueConfig[] }> {
  const reglages: Reglages = { mode: config.mode, masquer: config.masquer };
  const m = analyserMemo(hass, reglages);
  // Chaque carte reçoit les réglages, pour trier la maison comme la stratégie.
  const avecReglages = (c: CarteConfig): CarteConfig => ({ ...c, reglages });

  const sujets = [
    m.meteo && "meteo",
    m.temperaturesInterieures.length > 0 && "climat",
    m.lumieres.length > 0 && "lumieres",
    m.securite.length > 0 && "securite",
    m.puissanceReseau && "energie",
    m.mode === "decouverte" && "soleil",
    "systeme",
    m.aRanger.length > 0 && "a-ranger",
  ].filter((s): s is string => typeof s === "string");
  const pastilles = sujets.map((sujet) => avecReglages({ type: "custom:centralhome-pastille", sujet }));

  const accueil = m.mode === "decouverte"
    ? accueilDecouverte(hass, m, avecReglages, pastilles)
    : accueilMaison(hass, m, avecReglages, pastilles, await choisirFavoris(hass, m, config.favoris));
  return { title: config.title || "CentralHome", views: [accueil, ...sousVues(hass, m, avecReglages)] };
}
