// Les points ignorés « tant que ça ne change pas » : une fenêtre ouverte exprès ne reste pas
// en tête ; refermée puis rouverte, elle revient. Chaque point ignoré garde sa signature
// (l'état et l'heure du dernier changement, ou le texte du conseil) : dès qu'elle change, le
// point revient. Gardés dans les données de l'utilisateur de Home Assistant (le même réglage
// sur tous ses écrans), ou dans le navigateur si elles ne sont pas accessibles.
// Un point grave (fuite, fumée, alarme) ne s'ignore jamais.

import type { HomeAssistant } from "../ha";

const CLE = "automatic_dashboard_ignores";
export const EVENEMENT = "automatic-dashboard-ignores";
/** Au-delà, un point ignoré est oublié, même s'il n'a pas changé. */
const OUBLI = 30 * 24 * 3600000;

interface Ignore {
  /** La signature du point au moment où il a été ignoré. */
  s: string;
  /** Quand (millisecondes). */
  t: number;
}

/** Point → signature au moment où il a été ignoré. */
let ignores: Record<string, Ignore> = {};
let suivi = false;

export const estIgnore = (cle: string, signature: string): boolean => ignores[cle]?.s === signature;

function publier(valeur: unknown): void {
  // Les anciennes valeurs (une date par point) ne ressemblent pas à une signature : elles sont oubliées.
  const propre: Record<string, Ignore> = {};
  if (valeur && typeof valeur === "object") {
    for (const [cle, v] of Object.entries(valeur as Record<string, unknown>)) {
      if (v && typeof v === "object" && typeof (v as Ignore).s === "string" && typeof (v as Ignore).t === "number") propre[cle] = v as Ignore;
    }
  }
  ignores = propre;
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENEMENT));
}

function lireNavigateur(): void {
  try {
    publier(JSON.parse(localStorage.getItem(CLE) ?? "{}"));
  } catch {
    publier({});
  }
}

type Connexion = { subscribeMessage: (cb: (m: { value?: unknown }) => void, msg: object) => Promise<unknown> };

/** S'abonne une fois aux points ignorés de l'utilisateur : chaque écran suit les autres. */
export function suivreIgnores(hass: HomeAssistant): void {
  if (suivi) return;
  suivi = true;
  const connexion = (hass as { connection?: Connexion }).connection;
  if (!connexion) return lireNavigateur();
  connexion.subscribeMessage((message) => publier(message.value), { type: "frontend/subscribe_user_data", key: CLE }).catch(lireNavigateur);
}

/** Ignore des points tant qu'ils ne changent pas (ou les remontre). */
export async function ignorer(hass: HomeAssistant, points: { cle: string; signature: string }[], oui: boolean): Promise<void> {
  const maintenant = Date.now();
  const suivant = Object.fromEntries(Object.entries(ignores).filter(([, v]) => maintenant - v.t < OUBLI));
  for (const p of points) {
    if (oui) suivant[p.cle] = { s: p.signature, t: maintenant };
    else delete suivant[p.cle];
  }
  publier(suivant);
  try {
    await hass.callWS({ type: "frontend/set_user_data", key: CLE, value: suivant });
  } catch {
    localStorage.setItem(CLE, JSON.stringify(suivant));
  }
}

/** Pour les tests. */
export const remettreIgnores = (valeur: Record<string, Ignore> = {}): void => {
  ignores = valeur;
};
