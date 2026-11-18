// Les langues de l'interface, chacune dans son fichier (langues/fr.ts, langues/en.ts). Ajouter
// une langue : copier langues/en.ts, le traduire, puis l'ajouter à LANGUES ci-dessous ; le
// guide de contribution explique le reste.

import { en } from "./langues/en";
import { fr } from "./langues/fr";
import type { Langue } from "./langues/langue";

export const LANGUES: Record<string, Langue> = { fr, en };
/** La langue de secours, quand celle de l'utilisateur n'est pas traduite. */
export const SECOURS = en;

export const TEXTES = { fr: fr.textes, en: en.textes };
export type Textes = Langue["textes"];
export const MOTS_HEROS = { fr: fr.heros, en: en.heros };
export type MotsHeros = Langue["heros"];
export const EDITEUR = { fr: fr.editeur, en: en.editeur };
export type TextesEditeur = Langue["editeur"];

/** L'icône de chaque état de la météo ; son nom est dans chaque langue. */
export const ICONES_METEO: Record<string, string> = {
  "clear-night": "mdi:weather-night",
  cloudy: "mdi:weather-cloudy",
  fog: "mdi:weather-fog",
  hail: "mdi:weather-hail",
  lightning: "mdi:weather-lightning",
  "lightning-rainy": "mdi:weather-lightning-rainy",
  partlycloudy: "mdi:weather-partly-cloudy",
  pouring: "mdi:weather-pouring",
  rainy: "mdi:weather-rainy",
  snowy: "mdi:weather-snowy",
  "snowy-rainy": "mdi:weather-snowy-rainy",
  sunny: "mdi:weather-sunny",
  windy: "mdi:weather-windy",
  "windy-variant": "mdi:weather-windy-variant",
  exceptional: "mdi:alert-circle-outline",
};
