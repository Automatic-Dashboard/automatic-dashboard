// Point d'entrée : charge la police, enregistre la stratégie de tableau et les cartes
// Automatic Dashboard auprès de Home Assistant. Ce fichier est servi par l'intégration.

import { AutomaticApercu } from "./cartes/apercu";
import { AutomaticARanger } from "./cartes/a-ranger";
import { AutomaticBilan } from "./cartes/bilan";
import { AutomaticConfort } from "./cartes/confort";
import { AutomaticDepart } from "./cartes/depart";
import { AutomaticFavori } from "./cartes/favori";
import { AutomaticHeros } from "./cartes/heros";
import { AutomaticMesFavoris } from "./cartes/mes-favoris";
import { AutomaticMeteoFrance } from "./cartes/meteo-france";
import { AutomaticMoment } from "./cartes/moment";
import { AutomaticOuverture } from "./cartes/ouverture";
import { AutomaticPastille } from "./cartes/pastille";
import { AutomaticPiece } from "./cartes/piece";
import { AutomaticPlan } from "./cartes/plan";
import { AutomaticPoints } from "./cartes/points";
import { AutomaticPremiersPas } from "./cartes/premiers-pas";
import { AutomaticTablette } from "./cartes/tablette";
import { AutomaticEditeur } from "./editeur/editeur";
import type { HomeAssistant } from "./ha";
import { analyserMemo } from "./moteur/analyser";
import { chargerPolices } from "./polices";
import { langueDe } from "./outils";
import { preparerPremierTableau } from "./premier-tableau";
import { genererSection, sectionEnPanne, SECTIONS } from "./strategie/sections";
import { type ConfigStrategie, genererTableau, tableauEnPanne } from "./strategie/strategie";

/** Numéro de version, lu dans package.json à la construction. */
const VERSION = __VERSION__;

class AutomaticStrategie extends HTMLElement {
  static getCreateSuggestions() {
    return { title: "Automatic Dashboard", icon: "mdi:home-roof" };
  }

  static async generate(config: ConfigStrategie, hass: HomeAssistant) {
    try {
      return await genererTableau(config, hass);
    } catch (erreur) {
      console.error("Automatic Dashboard :", erreur);
      return tableauEnPanne(config, hass, erreur, VERSION);
    }
  }

  /** L'éditeur visuel, ouvert par « Modifier le tableau de bord ». */
  static async getConfigElement() {
    return document.createElement("automatic-dashboard-editeur");
  }
}

const elements: [string, CustomElementConstructor][] = [
  ["ll-strategy-dashboard-automatic-dashboard", AutomaticStrategie],
  ["automatic-dashboard-ouverture", AutomaticOuverture],
  ["automatic-dashboard-pastille", AutomaticPastille],
  ["automatic-dashboard-points", AutomaticPoints],
  ["automatic-dashboard-piece", AutomaticPiece],
  ["automatic-dashboard-apercu", AutomaticApercu],
  ["automatic-dashboard-premiers-pas", AutomaticPremiersPas],
  ["automatic-dashboard-heros", AutomaticHeros],
  ["automatic-dashboard-confort", AutomaticConfort],
  ["automatic-dashboard-a-ranger", AutomaticARanger],
  ["automatic-dashboard-meteo-france", AutomaticMeteoFrance],
  ["automatic-dashboard-moment", AutomaticMoment],
  ["automatic-dashboard-bilan", AutomaticBilan],
  ["automatic-dashboard-plan", AutomaticPlan],
  ["automatic-dashboard-tablette", AutomaticTablette],
  ["automatic-dashboard-favori", AutomaticFavori],
  ["automatic-dashboard-depart", AutomaticDepart],
  ["automatic-dashboard-mes-favoris", AutomaticMesFavoris],
  ["automatic-dashboard-editeur", AutomaticEditeur],
];
// Le fichier peut être chargé deux fois (ancienne et nouvelle version en mémoire) : on ne redéfinit rien.
for (const [balise, classe] of elements) {
  if (!customElements.get(balise)) customElements.define(balise, classe);
}

chargerPolices();
// Une seule fois par page : le fichier est chargé sur toutes les pages de Home Assistant.
if (!(window as unknown as { __automaticDashboardPremier?: boolean }).__automaticDashboardPremier) {
  (window as unknown as { __automaticDashboardPremier?: boolean }).__automaticDashboardPremier = true;
  preparerPremierTableau().catch(() => undefined);
}

declare global {
  interface Window {
    customStrategies?: Record<string, unknown>[];
    customCards?: Record<string, unknown>[];
    __automaticDashboard?: Record<string, unknown>;
  }
}

// Les textes des listes de Home Assistant, dans la langue de l'interface au chargement du fichier.
const ha = document.querySelector("home-assistant") as (HTMLElement & { hass?: HomeAssistant }) | null;
const lg = langueDe(ha?.hass ?? ({ locale: { language: localStorage.getItem("selectedLanguage")?.replace(/"/g, "") || navigator.language } } as HomeAssistant));
const DOC = "https://automatic-dashboard.github.io/documentation/";

// Le tableau, dans « Ajouter un tableau de bord », rubrique « Tableaux de bord communautaires »,
// pour créer un second tableau à la main : le premier est créé par l'intégration. Le type est
// celui de l'élément (ll-strategy-dashboard-automatic-dashboard).
window.customStrategies = window.customStrategies || [];
if (!window.customStrategies.some((s) => s.type === "automatic-dashboard")) {
  window.customStrategies.push({ type: "automatic-dashboard", strategyType: "dashboard", name: lg.tableau[0], description: lg.tableau[1], documentationURL: DOC });
}

// Les sections à glisser dans n'importe quel tableau, dans « Ajouter une section ».
for (const nom of SECTIONS) {
  const type = `automatic-dashboard-${nom}`;
  if (!customElements.get(`ll-strategy-section-${type}`)) {
    customElements.define(`ll-strategy-section-${type}`, class extends HTMLElement {
      static async generate(config: ConfigStrategie, hass: HomeAssistant) {
        try {
          return genererSection(nom, config, hass);
        } catch (erreur) {
          console.error("Automatic Dashboard :", erreur);
          return sectionEnPanne(hass, erreur);
        }
      }

      // L'aperçu de « Ajouter une section » : la configuration de départ, avec le type de la section.
      static getStubConfig() {
        return { type: `custom:${type}` };
      }
    });
  }
  if (!window.customStrategies.some((s) => s.type === type)) {
    window.customStrategies.push({ type, strategyType: "section", name: lg.sections[nom][0], description: lg.sections[nom][1], documentationURL: DOC });
  }
}

// Deux cartes utiles seules, proposées dans le choix des cartes de n'importe quel tableau.
window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === "automatic-dashboard-points")) {
  window.customCards.push(
    { type: "automatic-dashboard-points", name: lg.cartes.points[0], description: lg.cartes.points[1] },
    { type: "automatic-dashboard-piece", name: lg.cartes.piece[0], description: lg.cartes.piece[1] },
  );
}

window.__automaticDashboard = { version: VERSION, analyser: analyserMemo };
console.info(`Automatic Dashboard ${VERSION}`);
