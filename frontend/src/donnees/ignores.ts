// Les points ignorés pour aujourd'hui : une fenêtre ouverte exprès ne reste pas en tête
// toute la journée. Gardés dans les données de l'utilisateur de Home Assistant (le même
// réglage sur tous ses écrans), ou dans le navigateur si elles ne sont pas accessibles.
// Un point grave (fuite, fumée, alarme) ne s'ignore jamais.

import type { HomeAssistant } from "../ha";

const CLE = "automatic_dashboard_ignores";
export const EVENEMENT = "automatic-dashboard-ignores";

/** Point → jour où il a été ignoré (AAAA-MM-JJ, heure locale). */
let ignores: Record<string, string> = {};
let suivi = false;

const deux = (n: number) => String(n).padStart(2, "0");
export const aujourdhui = (d = new Date()): string => `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}`;

export const estIgnore = (cle: string): boolean => ignores[cle] === aujourdhui();
export const ignoresDuJour = (): string[] => Object.keys(ignores).filter(estIgnore);

function publier(valeur: Record<string, string> | null | undefined): void {
  ignores = valeur && typeof valeur === "object" ? valeur : {};
  window.dispatchEvent(new Event(EVENEMENT));
}

function lireNavigateur(): void {
  try {
    publier(JSON.parse(localStorage.getItem(CLE) ?? "{}"));
  } catch {
    publier({});
  }
}

/** S'abonne une fois aux points ignorés de l'utilisateur : chaque écran suit les autres. */
export function suivreIgnores(hass: HomeAssistant): void {
  if (suivi) return;
  suivi = true;
  const connexion = (hass as { connection?: { subscribeMessage: (cb: (m: { value?: Record<string, string> }) => void, msg: object) => Promise<unknown> } }).connection;
  if (!connexion) return lireNavigateur();
  connexion.subscribeMessage((message) => publier(message.value), { type: "frontend/subscribe_user_data", key: CLE }).catch(lireNavigateur);
}

/** Ignore un point jusqu'à demain (ou le remontre). Les jours passés sont oubliés. */
export async function ignorer(hass: HomeAssistant, cles: string[], oui: boolean): Promise<void> {
  const jour = aujourdhui();
  const suivant = Object.fromEntries(Object.entries(ignores).filter(([, j]) => j === jour));
  for (const cle of cles) {
    if (oui) suivant[cle] = jour;
    else delete suivant[cle];
  }
  publier(suivant);
  try {
    await hass.callWS({ type: "frontend/set_user_data", key: CLE, value: suivant });
  } catch {
    localStorage.setItem(CLE, JSON.stringify(suivant));
  }
}

/** Pour les tests. */
export const remettreIgnores = (valeur: Record<string, string> = {}): void => {
  ignores = valeur;
};
