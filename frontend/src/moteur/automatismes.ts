// « Me prévenir » : l'automatisme tout fait qui correspond à un point à regarder. Il couvre
// tous les capteurs du même genre (toutes les fuites, toutes les piles), prévient les
// téléphones de l'application Home Assistant et laisse une notification dans Home Assistant.
// Créé une fois, il appartient à l'utilisateur : il le retrouve et le modifie dans
// Paramètres, Automatisations.

import type { HomeAssistant } from "../ha";
import { langueDe } from "../outils";
import type { Maison } from "./types";

export type Sujet = "fuite" | "fumee" | "pile" | "sauvegarde";

export const SEUIL_PILE = 20;
const CLASSES_FUMEE = new Set(["smoke", "gas", "carbon_monoxide"]);

export interface Automatisme {
  id: string;
  config: Record<string, unknown>;
}

export const idAutomatisme = (sujet: Sujet): string => `automatic_dashboard_${sujet}`;

/** Cet automatisme existe-t-il déjà (créé ici, ou gardé après modification) ? */
export const automatismeExiste = (hass: HomeAssistant, sujet: Sujet): boolean =>
  Object.values(hass.states).some((s) => s.entity_id.startsWith("automation.") && s.attributes.id === idAutomatisme(sujet));

export const SUJETS: Sujet[] = ["fuite", "fumee", "pile", "sauvegarde"];

/** Qui prévenir : des téléphones de l'application Home Assistant, et la notification dans Home Assistant. */
export interface Destinataires {
  telephones: string[];
  homeAssistant: boolean;
}

const enSlug = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

/** Les téléphones qui ont l'application Home Assistant : le service de notification et le nom de l'appareil. */
export function telephones(hass: HomeAssistant): { service: string; nom: string }[] {
  const services = Object.keys((hass as { services?: Record<string, Record<string, unknown>> }).services?.notify ?? {})
    .filter((s) => s.startsWith("mobile_app_")).sort();
  const appareils = Object.values(hass.devices ?? {});
  return services.map((service) => {
    const slug = service.slice("mobile_app_".length);
    const appareil = appareils.find((a) => enSlug(a.name_by_user || a.name || "") === slug || enSlug(a.name || "") === slug);
    const nom = appareil?.name_by_user || appareil?.name || slug.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
    return { service, nom };
  });
}

/** Par défaut : tous les téléphones, et la notification dans Home Assistant. */
export const tousLesDestinataires = (hass: HomeAssistant): Destinataires => ({ telephones: telephones(hass).map((t) => t.service), homeAssistant: true });

function prevenir(titre: string, message: string, sujet: Sujet, d: Destinataires): Record<string, unknown>[] {
  return [
    ...(d.homeAssistant ? [{ action: "persistent_notification.create", data: { title: titre, message, notification_id: idAutomatisme(sujet) } }] : []),
    ...d.telephones.map((s) => ({ action: `notify.${s}`, data: { title: titre, message } })),
  ];
}

/** Les destinataires d'un automatisme existant, lus dans ses actions. */
export function destinatairesDe(config: { actions?: { action?: string; service?: string }[] } | null | undefined): Destinataires | null {
  if (!config) return null;
  const actions = (config.actions ?? []).map((a) => a.action ?? a.service ?? "");
  return {
    telephones: actions.filter((a) => a.startsWith("notify.mobile_app_")).map((a) => a.slice("notify.".length)),
    homeAssistant: actions.includes("persistent_notification.create"),
  };
}

/** L'automatisme d'un sujet, ou null si la maison n'a rien à surveiller pour lui. */
export function automatisme(hass: HomeAssistant, m: Maison, sujet: Sujet, destinataires: Destinataires = tousLesDestinataires(hass)): Automatisme | null {
  const tx = langueDe(hass).automatismes;
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
      alias: `Automatic Dashboard${langueDe(hass).textes.deuxPoints}${tx.alias[sujet]}`,
      description: tx.description,
      mode: "queued",
      triggers,
      conditions,
      actions: prevenir(tx.titre[sujet], tx.message[sujet], sujet, destinataires),
    },
  };
}

/** Crée l'automatisme dans Home Assistant (administrateur seulement), comme l'éditeur d'automatisations. */
export async function creerAutomatisme(hass: HomeAssistant, a: Automatisme): Promise<void> {
  await api(hass)("POST", `config/automation/config/${a.id}`, a.config);
}

type Api = (methode: string, chemin: string, donnees?: unknown) => Promise<unknown>;
const api = (hass: HomeAssistant): Api => {
  const appel = (hass as { callApi?: Api }).callApi;
  if (!appel) throw new Error("callApi indisponible");
  return appel;
};

/** La configuration d'un automatisme créé ici, ou null s'il n'existe pas (ou plus). */
export async function lireAutomatisme(hass: HomeAssistant, sujet: Sujet): Promise<{ actions?: { action?: string }[] } | null> {
  if (!automatismeExiste(hass, sujet)) return null;
  try {
    return (await api(hass)("GET", `config/automation/config/${idAutomatisme(sujet)}`)) as { actions?: { action?: string }[] };
  } catch {
    return null;
  }
}

/** Ne plus être prévenu : l'automatisme est supprimé. */
export async function supprimerAutomatisme(hass: HomeAssistant, sujet: Sujet): Promise<void> {
  await api(hass)("DELETE", `config/automation/config/${idAutomatisme(sujet)}`);
}
