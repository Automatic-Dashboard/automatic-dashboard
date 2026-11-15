// Point d'entrée : charge la police, enregistre la stratégie de tableau et les cartes
// CentralHome auprès de Home Assistant. Ce fichier est servi par l'intégration.

import { CentralHomeApercu } from "./cartes/apercu";
import { CentralHomeARanger } from "./cartes/a-ranger";
import { CentralHomeConfort } from "./cartes/confort";
import { CentralHomeHeros } from "./cartes/heros";
import { CentralHomeOuverture } from "./cartes/ouverture";
import { CentralHomePastille } from "./cartes/pastille";
import { CentralHomePiece } from "./cartes/piece";
import { CentralHomePoints } from "./cartes/points";
import { CentralHomePremiersPas } from "./cartes/premiers-pas";
import type { HomeAssistant } from "./ha";
import { analyserMemo } from "./moteur/analyser";
import { chargerPolices } from "./polices";
import { type ConfigStrategie, genererTableau } from "./strategie/strategie";

const VERSION = "2026.11.0";

class CentralHomeStrategie extends HTMLElement {
  static getCreateSuggestions() {
    return { title: "CentralHome", icon: "mdi:home-roof" };
  }

  static async generate(config: ConfigStrategie, hass: HomeAssistant) {
    return genererTableau(config, hass);
  }
}

const elements: [string, CustomElementConstructor][] = [
  ["ll-strategy-dashboard-centralhome", CentralHomeStrategie],
  ["centralhome-ouverture", CentralHomeOuverture],
  ["centralhome-pastille", CentralHomePastille],
  ["centralhome-points", CentralHomePoints],
  ["centralhome-piece", CentralHomePiece],
  ["centralhome-apercu", CentralHomeApercu],
  ["centralhome-premiers-pas", CentralHomePremiersPas],
  ["centralhome-heros", CentralHomeHeros],
  ["centralhome-confort", CentralHomeConfort],
  ["centralhome-a-ranger", CentralHomeARanger],
];
// Le fichier peut être chargé deux fois (ancienne et nouvelle version en mémoire) : on ne redéfinit rien.
for (const [balise, classe] of elements) {
  if (!customElements.get(balise)) customElements.define(balise, classe);
}

chargerPolices();

declare global {
  interface Window {
    customStrategies?: Record<string, unknown>[];
    customCards?: Record<string, unknown>[];
    __centralhome?: Record<string, unknown>;
  }
}

// Visible dans « Ajouter un tableau de bord », rubrique « Tableaux de bord communautaires » (Home Assistant 2026.5 et plus).
window.customStrategies = window.customStrategies || [];
if (!window.customStrategies.some((s) => s.type === "centralhome")) {
  window.customStrategies.push({
    type: "centralhome",
    strategyType: "dashboard",
    name: "CentralHome",
    description: "Un tableau de bord complet, construit tout seul à partir de vos appareils.",
    documentationURL: "https://github.com/CentralHome-HA/centralhome",
  });
}
// Deux cartes utiles seules, proposées dans le choix des cartes de n'importe quel tableau.
window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === "centralhome-points")) {
  window.customCards.push(
    { type: "centralhome-points", name: "CentralHome : points à regarder", description: "Ce qu'il faut regarder dans la maison, ou rien." },
    { type: "centralhome-piece", name: "CentralHome : pièce", description: "Une pièce, sa température et ce qui est allumé." },
  );
}

window.__centralhome = { version: VERSION, analyser: analyserMemo };
console.info(`CentralHome ${VERSION}`);
