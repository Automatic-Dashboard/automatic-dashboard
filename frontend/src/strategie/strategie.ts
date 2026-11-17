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

/** Les réglages lus dans la configuration du tableau, en ignorant ce qui n'a pas la bonne forme (YAML tapé à la main). */
export function lireReglages(config: ConfigStrategie): Reglages {
  const liste = (v: unknown): string[] | undefined => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : undefined);
  const modes = ["auto", "decouverte", "maison", "complet"];
  const noms = config.noms && typeof config.noms === "object" && !Array.isArray(config.noms)
    ? Object.fromEntries(Object.entries(config.noms).filter(([, v]) => typeof v === "string" && v.trim())) : undefined;
  return {
    mode: modes.includes(config.mode as string) ? config.mode : undefined,
    masquer: liste(config.masquer),
    favoris: liste(config.favoris),
    completer: config.completer === false ? false : undefined,
    noms,
  };
}

/** Les noms choisis dans les réglages, posés sur les cartes natives (tuiles, thermostats) qui n'en ont pas. */
function nommer(carte: CarteConfig, noms: Record<string, string>): CarteConfig {
  const id = typeof carte.entity === "string" ? carte.entity : "";
  return noms[id] && carte.name === undefined ? { ...carte, name: noms[id] } : carte;
}

export async function genererTableau(config: ConfigStrategie, hass: HomeAssistant): Promise<{ title: string; views: VueConfig[] }> {
  const reglages = lireReglages(config);
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
  const pastilles = sujets.map((sujet) => avecReglages({ type: "custom:automatic-dashboard-pastille", sujet }));

  const accueil = m.mode === "decouverte"
    ? accueilDecouverte(hass, m, avecReglages, pastilles)
    : accueilMaison(hass, m, avecReglages, pastilles, await choisirFavoris(hass, m, reglages));
  let views = [accueil, ...sousVues(hass, m, avecReglages)];
  if (Object.keys(m.noms).length) {
    views = views.map((v) => ({
      ...v,
      ...(v.sections ? { sections: v.sections.map((s) => ({ ...s, cards: s.cards.map((c) => nommer(c, m.noms)) })) } : {}),
      ...(v.sidebar ? { sidebar: { ...v.sidebar, sections: v.sidebar.sections.map((s) => ({ ...s, cards: s.cards.map((c) => nommer(c, m.noms)) })) } } : {}),
    }));
  }
  return { title: config.title || "Automatic Dashboard", views };
}
