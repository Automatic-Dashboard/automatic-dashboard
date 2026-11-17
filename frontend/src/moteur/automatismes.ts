// « Me prévenir » : l'automatisme tout fait qui correspond à un point à regarder. Il couvre
// tous les capteurs du même genre (toutes les fuites, toutes les piles), prévient les
// téléphones de l'application Home Assistant et laisse une notification dans Home Assistant.
// Créé une fois, il appartient à l'utilisateur : il le retrouve et le modifie dans
// Paramètres, Automatisations.

import type { HomeAssistant } from "../ha";
import { estFrancais } from "../outils";
import type { Maison } from "./types";

export type Sujet = "fuite" | "fumee" | "pile" | "sauvegarde";

export const SEUIL_PILE = 20;
const CLASSES_FUMEE = new Set(["smoke", "gas", "carbon_monoxide"]);

export interface Automatisme {
  id: string;
  config: Record<string, unknown>;
}

const TEXTES = {
  fr: {
    alias: { fuite: "prévenir en cas de fuite", fumee: "prévenir en cas de fumée ou de gaz", pile: "prévenir quand une pile est faible", sauvegarde: "prévenir si la sauvegarde échoue" },
    titre: { fuite: "Fuite détectée", fumee: "Fumée ou gaz détecté", pile: "Pile faible", sauvegarde: "Sauvegarde ratée" },
    message: {
      fuite: "{{ trigger.to_state.name }} a détecté de l'eau.",
      fumee: "{{ trigger.to_state.name }} s'est déclenché.",
      pile: "{{ trigger.to_state.name }} : {{ trigger.to_state.state }} %, à changer bientôt.",
      sauvegarde: "La dernière sauvegarde automatique de Home Assistant a échoué.",
    },
    description: "Créé par Automatic Dashboard, depuis un point à regarder. Il vous appartient : modifiez-le librement.",
  },
  en: {
    alias: { fuite: "notify on leak", fumee: "notify on smoke or gas", pile: "notify when a battery is low", sauvegarde: "notify if the backup fails" },
    titre: { fuite: "Leak detected", fumee: "Smoke or gas detected", pile: "Low battery", sauvegarde: "Backup failed" },
    message: {
      fuite: "{{ trigger.to_state.name }} detected water.",
      fumee: "{{ trigger.to_state.name }} went off.",
      pile: "{{ trigger.to_state.name }}: {{ trigger.to_state.state }}%, replace it soon.",
      sauvegarde: "The last automatic Home Assistant backup failed.",
    },
    description: "Created by Automatic Dashboard from a thing to check. It is yours: edit it freely.",
  },
};

export const idAutomatisme = (sujet: Sujet): string => `automatic_dashboard_${sujet}`;

/** Cet automatisme existe-t-il déjà (créé ici, ou gardé après modification) ? */
export const automatismeExiste = (hass: HomeAssistant, sujet: Sujet): boolean =>
  Object.values(hass.states).some((s) => s.entity_id.startsWith("automation.") && s.attributes.id === idAutomatisme(sujet));

/** Les téléphones de l'application Home Assistant, plus la notification dans Home Assistant. */
function prevenir(hass: HomeAssistant, titre: string, message: string, sujet: Sujet): Record<string, unknown>[] {
  const telephones = Object.keys((hass as { services?: Record<string, Record<string, unknown>> }).services?.notify ?? {})
    .filter((s) => s.startsWith("mobile_app_")).sort();
  return [
    { action: "persistent_notification.create", data: { title: titre, message, notification_id: idAutomatisme(sujet) } },
    ...telephones.map((s) => ({ action: `notify.${s}`, data: { title: titre, message } })),
  ];
}

/** L'automatisme d'un sujet, ou null si la maison n'a rien à surveiller pour lui. */
export function automatisme(hass: HomeAssistant, m: Maison, sujet: Sujet): Automatisme | null {
  const tx = estFrancais(hass) ? TEXTES.fr : TEXTES.en;
  let triggers: Record<string, unknown>[] = [];
  let conditions: Record<string, unknown>[] = [];

  if (sujet === "fuite" || sujet === "fumee") {
    const ids = m.alertes.filter((e) => (sujet === "fuite" ? e.classe === "moisture" : CLASSES_FUMEE.has(e.classe ?? ""))).map((e) => e.id);
    if (!ids.length) return null;
    triggers = [{ trigger: "state", entity_id: ids, from: "off", to: "on" }];
  } else if (sujet === "pile") {
    const nombres = m.piles.filter((e) => e.domaine === "sensor").map((e) => e.id);
    const binaires = m.piles.filter((e) => e.domaine === "binary_sensor").map((e) => e.id);
    if (nombres.length) triggers.push({ trigger: "numeric_state", entity_id: nombres, below: SEUIL_PILE });
    if (binaires.length) triggers.push({ trigger: "state", entity_id: binaires, from: "off", to: "on" });
    if (!triggers.length) return null;
  } else {
    const capteur = (cle: string) => m.systeme.find((e) => e.plateforme === "backup" && hass.entities[e.id]?.translation_key === cle)?.id;
    const tentee = capteur("last_attempted_automatic_backup");
    const reussie = capteur("last_successful_automatic_backup");
    if (!tentee || !reussie) return null;
    triggers = [{ trigger: "state", entity_id: tentee }];
    // Une tentative plus récente que la dernière réussite : elle a échoué.
    conditions = [{ condition: "template", value_template:
      `{% set t = states('${tentee}') | as_datetime %}{% set r = states('${reussie}') | as_datetime %}{{ t is not none and (r is none or t > r) }}` }];
  }

  return {
    id: idAutomatisme(sujet),
    config: {
      id: idAutomatisme(sujet),
      alias: `Automatic Dashboard${estFrancais(hass) ? " : " : ": "}${tx.alias[sujet]}`,
      description: tx.description,
      mode: "queued",
      triggers,
      conditions,
      actions: prevenir(hass, tx.titre[sujet], tx.message[sujet], sujet),
    },
  };
}

/** Crée l'automatisme dans Home Assistant (administrateur seulement), comme l'éditeur d'automatisations. */
export async function creerAutomatisme(hass: HomeAssistant, a: Automatisme): Promise<void> {
  const api = (hass as { callApi?: (methode: string, chemin: string, donnees?: unknown) => Promise<unknown> }).callApi;
  if (!api) throw new Error("callApi indisponible");
  await api("POST", `config/automation/config/${a.id}`, a.config);
}
