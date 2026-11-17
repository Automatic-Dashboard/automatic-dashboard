// Les briques de configuration des vues : sections, titres, tuiles, vue complète.
// D'après docs/conception/01-mise-en-page.md : une scène (sections column_span 2,
// 24 cases sur ordinateur, 12 sur téléphone) et un côté (colonne « sidebar »,
// visible à 3 colonnes, recopié dans le flux sinon).

import type { Entite, Mode } from "../moteur/types";

/** Configuration d'une carte de tableau (forme libre, comme dans Home Assistant). */
export interface CarteConfig {
  type: string;
  grid_options?: Record<string, unknown>;
  [cle: string]: unknown;
}

export interface SectionConfig {
  type: "grid";
  column_span?: number;
  cards: CarteConfig[];
  visibility?: Record<string, unknown>[];
}

export interface VueConfig {
  path: string;
  title: string;
  icon: string;
  type: "sections";
  max_columns: number;
  theme: string;
  subview: boolean;
  header: Record<string, unknown>;
  badges: CarteConfig[];
  sections: SectionConfig[];
  sidebar?: { visibility: Record<string, unknown>[]; sections: SectionConfig[] };
}

export const THEME = "Automatic Dashboard";

export const section = (cartes: CarteConfig[], extra: Partial<SectionConfig> = {}): SectionConfig =>
  ({ type: "grid", column_span: 2, cards: cartes, ...extra });
export const titre = (texte: string, extra: Record<string, unknown> = {}): CarteConfig =>
  ({ type: "heading", heading: texte, heading_style: "title", ...extra });
export const sousTitre = (texte: string, extra: Record<string, unknown> = {}): CarteConfig =>
  ({ type: "heading", heading: texte, heading_style: "subtitle", ...extra });

interface OptionsVue {
  path: string;
  title: string;
  icon: string;
  ouverture: CarteConfig;
  badges?: CarteConfig[];
  scene: SectionConfig[];
  cote?: CarteConfig[];
  subview?: boolean;
  /** Sur tablette, le côté s'insère après ce nombre de sections de la scène. */
  coteApres?: number;
}

/** Une vue complète : en-tête posé sur le fond, pastilles, scène et côté (avec ses deux copies). */
export function vue({ path, title, icon, ouverture, badges = [], scene, cote = [], subview = false, coteApres = 0 }: OptionsVue): VueConfig {
  const sections = [...scene];
  if (cote.length) {
    // Tablette : le côté remonte après le premier groupe ; téléphone : il descend en bas.
    sections.splice(coteApres, 0, section(cote, { visibility: [{ condition: "view_columns", min: 2, max: 2 }] }));
    sections.push(section(cote, { visibility: [{ condition: "view_columns", max: 1 }] }));
  }
  return {
    path, title, icon, type: "sections", max_columns: 3, theme: THEME, subview,
    header: { layout: "start", badges_position: "bottom", badges_wrap: "scroll", card: ouverture },
    badges,
    sections,
    ...(cote.length ? { sidebar: { visibility: [{ condition: "view_columns", min: 3 }], sections: [{ type: "grid", cards: cote }] } } : {}),
  };
}

/** Une tuile native, avec la fonction qui convient à l'appareil (sauf en mode Complet, plus compact). */
export function tuile(e: Entite, mode: Mode, options: Record<string, unknown> & { sansFonction?: boolean } = {}): CarteConfig {
  const { sansFonction, titre: _titre, ...reste } = options;
  const carte: CarteConfig = { type: "tile", entity: e.id, ...reste };
  if (sansFonction || mode === "complet") return carte;
  if (e.domaine === "light") carte.features = [{ type: "light-brightness" }];
  else if (e.domaine === "cover") carte.features = [{ type: "cover-open-close" }];
  else if (e.domaine === "climate") carte.features = [{ type: "target-temperature" }];
  else if (e.domaine === "lock") carte.features = [{ type: "lock-commands" }];
  else if (e.domaine === "sensor" && e.classe && ["temperature", "humidity", "power", "carbon_dioxide"].includes(e.classe)) {
    carte.features = [{ type: "trend-graph" }];
  }
  return carte;
}

export const aFonction = (c: CarteConfig): boolean => Array.isArray(c.features) && c.features.length > 0;
