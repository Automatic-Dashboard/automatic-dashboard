// La stratégie de tableau : Home Assistant l'appelle pour fabriquer le tableau, puis
// la rappelle quand les entités, les appareils, les pièces ou les étages changent.

import { chargerReglagesEnergie } from "../donnees/energie";
import type { HomeAssistant } from "../ha";
import { analyserMemo } from "../moteur/analyser";
import type { Reglages } from "../moteur/types";
import { accueilDecouverte, accueilMaison, favorisDeLaPersonne } from "./accueil";
import { type CarteConfig, THEME, type VueConfig } from "./configs";
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
  const parmi = <T extends string>(v: unknown, permis: readonly T[]): T | undefined => (permis.includes(v as T) ? (v as T) : undefined);
  const heureValide = (v: unknown) => (typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 23 ? v : undefined);
  const t = config.tablette && typeof config.tablette === "object" ? config.tablette : undefined;
  const tablette = t ? {
    debut_nuit: heureValide(t.debut_nuit), fin_nuit: heureValide(t.fin_nuit),
    reveil: typeof t.reveil === "string" && t.reveil.includes(".") ? t.reveil : undefined,
  } : undefined;
  return {
    mode: modes.includes(config.mode as string) ? config.mode : undefined,
    masquer: liste(config.masquer),
    favoris: liste(config.favoris),
    completer: config.completer === false ? false : undefined,
    noms,
    style: parmi(config.style, ["automatic", "doux", "contraste", "home_assistant"] as const),
    pieces: parmi(config.pieces, ["barres", "mosaique"] as const),
    tuiles: parmi(config.tuiles, ["automatic", "home_assistant"] as const),
    ciel: config.ciel === false ? false : undefined,
    conseils: config.conseils === false ? false : undefined,
    bilan: config.bilan === false ? false : undefined,
    tablette: tablette && Object.values(tablette).some((v) => v !== undefined) ? tablette : undefined,
  };
}

/** Les noms choisis dans les réglages, posés sur les cartes natives (tuiles, thermostats) qui n'en ont pas. */
function nommer(carte: CarteConfig, noms: Record<string, string>): CarteConfig {
  const id = typeof carte.entity === "string" ? carte.entity : "";
  return noms[id] && carte.name === undefined ? { ...carte, name: noms[id] } : carte;
}

export async function genererTableau(config: ConfigStrategie, hass: HomeAssistant): Promise<{ title: string; views: VueConfig[] }> {
  const reglages = lireReglages(config);
  // Les réglages Énergie de Home Assistant (compteurs et prix déclarés), lus avant de construire.
  await chargerReglagesEnergie(hass);
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
    m.air.length > 0 && "air",
    m.vehicules.length > 0 && "vehicule",
    m.exterieur.length >= 3 && "exterieur",
    m.aRanger.length > 0 && "a-ranger",
    m.mode !== "decouverte" && (m.lumieres.length > 0 || m.securite.length > 0) && "depart",
  ].filter((s): s is string => typeof s === "string");
  const pastilles = sujets.map((sujet) => avecReglages({ type: "custom:automatic-dashboard-pastille", sujet }));

  const accueil = m.mode === "decouverte"
    ? accueilDecouverte(hass, m, avecReglages, pastilles)
    : accueilMaison(hass, m, avecReglages, pastilles, await favorisDeLaPersonne(hass, m, reglages));
  let views = [accueil, ...sousVues(hass, m, avecReglages, reglages)];
  if (Object.keys(m.noms).length) {
    views = views.map((v) => ({
      ...v,
      ...(v.sections ? { sections: v.sections.map((s) => ({ ...s, cards: s.cards.map((c) => nommer(c, m.noms)) })) } : {}),
      ...(v.sidebar ? { sidebar: { ...v.sidebar, sections: v.sidebar.sections.map((s) => ({ ...s, cards: s.cards.map((c) => nommer(c, m.noms)) })) } } : {}),
    }));
  }
  // Le style choisi : un des trois thèmes Automatic Dashboard, ou celui du profil Home Assistant.
  const theme = { automatic: THEME, doux: `${THEME} Soft`, contraste: `${THEME} Contrast`, home_assistant: undefined }[reglages.style ?? "automatic"];
  views = views.map(({ theme: _ancien, ...v }) => (theme ? { ...v, theme } : v) as VueConfig);
  return { title: config.title || "Automatic Dashboard", views };
}
