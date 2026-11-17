// Le diagnostic à copier : la maison décrite sans noms ni valeurs, dans le format des
// maisons d'essai (tests/fixtures). Joint à un ticket, il devient un cas de test
// (tests/cas) : on rejoue le tri sur la même maison, sans rien savoir de ses habitants.
//
// Ce qui est gardé : la structure (domaines, intégrations, appareils, pièces, étages),
// les attributs qui décident du tri (classe, unité, catégorie, fabricant, modèle) et,
// dans les noms, les seuls mots que les règles reconnaissent (« signal », « jardin »,
// « compteur »…). Ce qui est retiré : tous les autres mots, les valeurs, les états de
// présence, les coordonnées et le nom de la maison.

import type { AppareilHA, EntiteHA, EtageHA, EtatHA, HomeAssistant, Instantane, PieceHA } from "./ha";
import { analyser } from "./moteur/analyser";
import { ICONES_PIECES, NOM_TECHNIQUE, PIECES_ANNEXES, PIECES_EXTERIEURES } from "./moteur/regles";
import type { Entite, Reglages } from "./moteur/types";

export const FORMAT_DIAGNOSTIC = 1;
/** Le formulaire de ticket « Le tableau range mal un appareil ». */
export const TICKET_CLASSEMENT = "https://github.com/Automatic-Dashboard/automatic-dashboard/issues/new?template=1-classement.yml";
/** Au-delà, GitHub refuse le texte collé dans un ticket : il faut joindre le fichier. */
export const LIMITE_COLLER = 60000;

/** Les mots que les règles lisent dans un nom : on les garde, et rien d'autre. */
const MOTS_CLES: RegExp[] = [
  NOM_TECHNIQUE, PIECES_EXTERIEURES, PIECES_ANNEXES, ...ICONES_PIECES.map(([motif]) => motif),
  /linky|compteur|tic\b|meter|grid|r(é|e)seau|maison|home|total|index/i, /humid|co2|co₂/i,
].map((m) => new RegExp(m.source, "gi"));

/** Suffixes d'identifiant que le moteur reconnaît (Météo-France). */
const SUFFIXES = ["_next_rain", "_weather_alert"];
/** Identifiants qui ne disent rien de la maison. */
const IDS_PUBLICS = new Set(["sun.sun", "zone.home"]);
/** Attributs gardés tels quels : ils décident du tri, pas d'une valeur. */
const ATTRIBUTS = ["device_class", "unit_of_measurement", "state_class", "supported_features", "icon", "hvac_modes", "restored"];
const COULEURS_VIGILANCE = new Set(["Vert", "Jaune", "Orange", "Rouge"]);

/** Ne garde d'un nom que les mots-clés des règles ; `vide` s'il n'en contient aucun. */
export function anonymiserNom(nom: string | null | undefined, vide: string): string {
  if (!nom) return vide;
  const trouves: [number, string][] = [];
  for (const motif of MOTS_CLES) {
    for (const m of nom.matchAll(motif)) trouves.push([m.index ?? 0, m[0].toLowerCase()]);
  }
  const mots = [...new Set(trouves.sort((a, b) => a[0] - b[0]).map(([, mot]) => mot))];
  return mots.length ? mots.join(" ") : vide;
}

/** Un état sans valeur : les énumérations (on, heat, open…) restent, les nombres deviennent 0, le reste « unknown ». */
function anonymiserEtat(domaine: string, etat: string): string {
  if (["person", "device_tracker"].includes(domaine)) return "unknown";
  if (/^-?\d+([.,]\d+)?$/.test(etat)) return "0";
  if (/^[a-z_]{1,30}$/.test(etat) || COULEURS_VIGILANCE.has(etat)) return etat;
  return "unknown";
}

export interface Signalement {
  entite: string;
  domaine: string;
  plateforme: string;
  /** Ce que le tri en a fait : écartée (et pourquoi), ou son rôle, sa section et sa pièce. */
  verdict: { ecart: string | null; role: string | null; section: string | null; piece: string | null; aRanger: boolean };
}

export interface Diagnostic {
  diagnostic: number;
  version: string;
  home_assistant: string | null;
  langue: string;
  reglages: Reglages;
  resultat: { mode: string; U: number; D: number; P: number; T: number; pieces: number; aRanger: number };
  signalement: Signalement[];
  maison: Instantane & { config: { version: string | null; components: string[]; latitude: 0; longitude: 0 } };
}

/** Le verdict du tri pour une entité, avec les identifiants de la maison décrite. */
export function verdict(e: Entite | undefined, aRanger: Set<string>, piece: (id: string | null) => string | null) {
  return {
    ecart: e ? e.ecart : "absente", role: e?.role ?? null, section: e?.section ?? null,
    piece: piece(e?.piece ?? null), aRanger: Boolean(e && aRanger.has(e.id)),
  };
}

/**
 * Décrit la maison sans noms ni valeurs.
 * `cibles` : les entités que l'utilisateur signale (mal rangées, absentes, en trop).
 */
export function diagnostiquer(hass: HomeAssistant, reglages: Reglages = {}, cibles: string[] = []): Diagnostic {
  const numero = new Map<string, number>();
  const compteur = (prefixe: string) => {
    const n = (numero.get(prefixe) ?? 0) + 1;
    numero.set(prefixe, n);
    return n;
  };
  const table = (prefixe: string) => {
    const t = new Map<string, string>();
    return (id: string | null | undefined): string | null => {
      if (!id) return null;
      if (!t.has(id)) t.set(id, `${prefixe}${compteur(prefixe)}`);
      return t.get(id)!;
    };
  };
  const pieceId = table("p");
  const etageId = table("e");
  const appareilId = table("a");
  const etiquetteBrute = table("l");
  const etiquette = (id: string) => (id.startsWith("automatic_dashboard_") ? id : etiquetteBrute(id)!);
  const entites = new Map<string, string>();
  const entiteId = (id: string | null | undefined): string | null => {
    if (!id) return null;
    if (IDS_PUBLICS.has(id)) return id;
    if (!entites.has(id)) {
      const [domaine] = id.split(".");
      const suffixe = SUFFIXES.find((s) => id.endsWith(s)) ?? "";
      entites.set(id, `${domaine}.n${compteur(`n.${domaine}`)}${suffixe}`);
    }
    return entites.get(id)!;
  };

  // Les étages et les pièces d'abord, dans l'ordre de Home Assistant : il décide de l'ordre du tableau.
  const floors: Record<string, EtageHA> = {};
  for (const f of Object.values(hass.floors ?? {})) {
    const id = etageId(f.floor_id)!;
    floors[id] = { floor_id: id, name: `Étage ${id.slice(1)}`, level: f.level ?? null, icon: f.icon ?? null };
  }
  const areas: Record<string, PieceHA & { labels: string[]; aliases: string[] }> = {};
  for (const a of Object.values(hass.areas ?? {})) {
    const id = pieceId(a.area_id)!;
    areas[id] = {
      area_id: id, name: anonymiserNom(a.name, `Pièce ${id.slice(1)}`), icon: a.icon ?? null, floor_id: etageId(a.floor_id),
      temperature_entity_id: entiteId(a.temperature_entity_id), humidity_entity_id: entiteId(a.humidity_entity_id),
      labels: ((a as { labels?: string[] }).labels ?? []).map(etiquette), aliases: [],
    };
  }
  const devices: Record<string, AppareilHA & { labels: string[] }> = {};
  for (const d of Object.values(hass.devices ?? {})) {
    const id = appareilId(d.id)!;
    devices[id] = {
      id, name: anonymiserNom(d.name, "appareil"), name_by_user: d.name_by_user ? anonymiserNom(d.name_by_user, "appareil") : null,
      area_id: pieceId(d.area_id), parent_device_id: appareilId(d.parent_device_id), entry_type: d.entry_type ?? null,
      manufacturer: d.manufacturer ?? null, model: d.model ?? null,
      labels: ((d as { labels?: string[] }).labels ?? []).map(etiquette),
    };
  }
  const entities: Record<string, EntiteHA> = {};
  for (const en of Object.values(hass.entities ?? {})) {
    const id = entiteId(en.entity_id)!;
    entities[id] = {
      entity_id: id, platform: en.platform, name: en.name ? anonymiserNom(en.name, "nom") : (en.name ?? null),
      device_id: appareilId(en.device_id), area_id: pieceId(en.area_id), hidden: en.hidden ?? false,
      entity_category: en.entity_category ?? null, translation_key: en.translation_key ?? null,
      labels: (en.labels ?? []).map(etiquette), icon: en.icon ?? null,
    };
  }
  const states: Record<string, EtatHA> = {};
  for (const s of Object.values(hass.states)) {
    const id = entiteId(s.entity_id)!;
    const [domaine] = s.entity_id.split(".");
    const attributes: Record<string, unknown> = {};
    for (const cle of ATTRIBUTS) if (s.attributes[cle] !== undefined) attributes[cle] = s.attributes[cle];
    if (s.attributes.friendly_name !== undefined) attributes.friendly_name = anonymiserNom(String(s.attributes.friendly_name), "nom");
    if (Array.isArray(s.attributes.entity_id)) attributes.entity_id = s.attributes.entity_id.map((x: string) => entiteId(x));
    if (s.attributes["1_hour_forecast"] !== undefined) attributes["1_hour_forecast"] = {};
    states[id] = { entity_id: id, state: anonymiserEtat(domaine, s.state), attributes };
  }

  const m = analyser(hass, reglages);
  const parId = new Map(m.toutes.map((e) => [e.id, e]));
  const aRanger = new Set(m.aRanger.map((e) => e.id));
  const ids = (liste?: string[]) => liste?.filter((id) => hass.states[id]).map((id) => entiteId(id)!);
  return {
    diagnostic: FORMAT_DIAGNOSTIC,
    version: __VERSION__,
    home_assistant: hass.config?.version ?? null,
    langue: (hass.locale?.language || hass.language || "").slice(0, 2),
    reglages: {
      ...(reglages.mode ? { mode: reglages.mode } : {}),
      ...(reglages.completer === false ? { completer: false } : {}),
      ...(reglages.masquer?.length ? { masquer: ids(reglages.masquer) } : {}),
      ...(reglages.favoris?.length ? { favoris: ids(reglages.favoris) } : {}),
    },
    resultat: { mode: m.mode, ...m.compteurs, pieces: m.pieces.length, aRanger: m.aRanger.length },
    signalement: cibles.filter((id) => hass.states[id] || hass.entities[id]).map((id) => ({
      entite: entiteId(id)!, domaine: id.split(".")[0], plateforme: hass.entities[id]?.platform ?? "",
      verdict: verdict(parId.get(id), aRanger, pieceId),
    })),
    maison: {
      states, entities, devices, areas, floors,
      config: { version: hass.config?.version ?? null, components: [...(hass.config?.components ?? [])].sort(), latitude: 0, longitude: 0 },
    },
  };
}

/** Le texte à joindre au ticket : du JSON lisible, pour que chacun voie ce qu'il envoie. */
export const texteDiagnostic = (d: Diagnostic): string => `${JSON.stringify(d, null, 1)}\n`;

/** Copie un texte, même hors HTTPS (Home Assistant est souvent servi en http sur le réseau local). */
export async function copier(texte: string, racine: Node = document.body): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texte);
    return true;
  } catch {
    // L'ancienne méthode, dans la racine du dialogue pour ne pas sortir de son piège à focus.
    const zone = document.createElement("textarea");
    zone.value = texte;
    zone.setAttribute("readonly", "");
    zone.style.cssText = "position:fixed;top:0;left:0;opacity:0";
    racine.appendChild(zone);
    zone.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch { ok = false; }
    zone.remove();
    return ok;
  }
}

/** Enregistre le diagnostic dans un fichier, à joindre au ticket. */
export function telecharger(texte: string): void {
  const url = URL.createObjectURL(new Blob([texte], { type: "application/json" }));
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = `automatic-dashboard-diagnostic-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
