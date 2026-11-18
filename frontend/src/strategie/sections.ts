// Les sections à glisser dans n'importe quel tableau : des morceaux d'Automatic Dashboard,
// proposés dans « Ajouter une section » de Home Assistant (stratégies de section). Chacune suit
// la maison comme le tableau complet, avec les mêmes réglages facultatifs (mode, masqués, noms,
// pièces en barres ou en mosaïque), à écrire dans la configuration de la section.

import type { HomeAssistant } from "../ha";
import { t } from "../outils";
import { type CarteConfig, titre } from "./configs";
import { type ConfigStrategie, lireReglages } from "./strategie";

export const SECTIONS = ["etat", "moment", "climat", "systeme", "a-ranger", "depart"] as const;
export type NomSection = (typeof SECTIONS)[number];

export interface SectionGeneree {
  type: "grid";
  cards: CarteConfig[];
}

/** Les cartes d'une section, avec les réglages de sa configuration. */
export function genererSection(nom: NomSection, config: ConfigStrategie, hass: HomeAssistant): SectionGeneree {
  const reglages = lireReglages(config);
  const avec = (c: CarteConfig): CarteConfig => ({ ...c, reglages });
  const tx = t(hass);
  const cartes: Record<NomSection, () => CarteConfig[]> = {
    // L'état de la maison en une phrase, le ciel du jour, puis les points à regarder.
    etat: () => [avec({ type: "custom:automatic-dashboard-ouverture", page: "accueil" }), avec({ type: "custom:automatic-dashboard-points" })],
    // La carte « En ce moment » porte son propre titre.
    moment: () => [avec({ type: "custom:automatic-dashboard-moment" })],
    climat: () => [
      titre(tx.climat),
      avec({ type: "custom:automatic-dashboard-heros", page: "climat" }),
      avec({ type: reglages.pieces === "mosaique" ? "custom:automatic-dashboard-plan" : "custom:automatic-dashboard-confort" }),
    ],
    systeme: () => [titre(tx.systeme), avec({ type: "custom:automatic-dashboard-heros", page: "systeme" })],
    "a-ranger": () => [titre(tx.aRanger), avec({ type: "custom:automatic-dashboard-a-ranger" })],
    depart: () => [titre(tx.jePars), avec({ type: "custom:automatic-dashboard-depart" })],
  };
  return { type: "grid", cards: cartes[nom]() };
}

/** Quand une section ne peut pas se construire : une ligne qui le dit, plutôt qu'une erreur technique. */
export function sectionEnPanne(hass: HomeAssistant, erreur: unknown): SectionGeneree {
  const message = erreur instanceof Error ? erreur.message : String(erreur);
  return { type: "grid", cards: [{ type: "markdown", content: `**${t(hass).panneTitre}**\n\n\`${message.slice(0, 300)}\`` }] };
}
