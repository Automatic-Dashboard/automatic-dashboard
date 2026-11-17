// Les règles de tri, d'après docs/conception/03-mode-complet.md : on écarte d'abord,
// puis on donne à chaque entité un rôle et une section.

import type { EntiteHA, EtatHA } from "../ha";
import type { Entite } from "./types";

export const DOMAINES_TECHNIQUES = new Set(["ai_task", "assist_satellite", "automation", "configurator", "conversation",
  "device_tracker", "event", "geo_location", "image_processing", "notify", "persistent_notification", "stt", "tag", "tts",
  "wake_word", "zone", "sun", "person"]);
export const AIDES = new Set(["input_boolean", "input_button", "input_number", "input_select", "input_text", "input_datetime",
  "counter", "timer", "schedule", "script"]);
export const PLATEFORMES_SYSTEME = new Set(["backup", "hassio", "systemmonitor", "glances", "uptime_kuma", "adguard", "pi_hole",
  "speedtestdotnet", "proxmoxve", "synology_dsm", "unifi", "truenas", "fritz", "netdata"]);
/** Intégrations installées d'office ou de données publiques : jamais comptées comme équipement, jamais « à ranger ». */
export const PLATEFORMES_OFFICE = new Set(["sun", "backup", "met", "person", "shopping_list", "google_translate", "radio_browser",
  "go2rtc", "analytics", "marketplace", "meteo_france", "holiday", "moon", "open_meteo", "mobile_app", "local_calendar",
  "local_todo", "workday", "season"]);
const CLASSES_TECHNIQUES = new Set(["signal_strength", "timestamp", "date", "duration", "data_rate", "data_size", "enum"]);
const UNITES_TECHNIQUES = new Set(["lqi", "dBm", "dB", "ms", "B", "kB", "MB", "GB", "bit/s", "kbit/s", "Mbit/s"]);
export const MESURES = new Set(["temperature", "humidity", "carbon_dioxide", "pm25", "pm10", "pm1", "volatile_organic_compounds",
  "aqi", "nitrogen_dioxide", "ozone", "carbon_monoxide"]);
const MESURES_SECONDAIRES = new Set(["illuminance", "atmospheric_pressure", "pressure", "sound_pressure", "moisture", "distance",
  "speed", "wind_speed", "precipitation", "irradiance", "weight"]);
export const ENERGIE = new Set(["power", "apparent_power", "energy", "gas", "water"]);
const ENERGIE_SECONDAIRE = new Set(["current", "voltage", "power_factor", "reactive_power", "frequency", "volume_flow_rate",
  "energy_storage", "monetary"]);
export const OUVRANTS = new Set(["door", "window", "garage_door", "opening"]);
export const ALERTES = new Set(["moisture", "smoke", "gas", "carbon_monoxide", "safety", "tamper", "glass_break", "heat", "cold"]);
const PRESENCES = new Set(["motion", "occupancy", "presence"]);
export const NOM_TECHNIQUE = /signal|rssi|lqi|qualit(é|e) du lien|link ?quality|uptime|derni(è|e)re vue|last seen|adresse ip|ip address|wi-?fi|micrologiciel|firmware/i;

export const ICONES_PIECES: [RegExp, string][] = [
  [/salle (à|a) manger|dining/i, "mdi:silverware-fork-knife"], [/salle de bain|bathroom|douche|sdb/i, "mdi:shower"],
  [/salon|s(é|e)jour|living|lounge/i, "mdi:sofa-outline"], [/cuisine|kitchen/i, "mdi:stove"],
  [/enfant|b(é|e)b(é|e)|kid|nursery/i, "mdi:teddy-bear"], [/chambre|bedroom/i, "mdi:bed-outline"],
  [/\bwc\b|toilette|toilet/i, "mdi:toilet"], [/bureau|office|study/i, "mdi:desk"], [/entr(é|e)e|hall\b|entrance/i, "mdi:door-open"],
  [/couloir|palier|hallway|corridor/i, "mdi:stairs"], [/garage/i, "mdi:garage"],
  [/jardin|terrasse|balcon|cour\b|garden|terrace|patio|ext(é|e)rieur|outside/i, "mdi:flower-outline"],
  [/buanderie|laundry/i, "mdi:washing-machine"], [/cave|cellier|cellar|basement/i, "mdi:stairs-down"],
  [/grenier|combles|attic/i, "mdi:home-roof"], [/dressing|closet/i, "mdi:hanger"],
];
/** Icône d'une pièce d'après son nom, quand l'utilisateur n'en a pas choisi. */
export const iconePiece = (nom: string): string => ICONES_PIECES.find(([motif]) => motif.test(nom))?.[1] ?? "mdi:home-outline";
export const PIECES_EXTERIEURES = /jardin|terrasse|balcon|cour\b|garden|terrace|patio|ext(é|e)rieur|outside|piscine|pool/i;
export const PIECES_ANNEXES = /garage|cave|cellier|grenier|combles|abri|cellar|basement|attic|shed/i;

/**
 * Les étiquettes de réglage en masse, créées par l'intégration dans la langue de Home Assistant :
 * l'identifiant vient du nom à la création, les deux langues sont reconnues.
 */
export const ETIQUETTES = {
  masquer: ["automatic_dashboard_masquer", "automatic_dashboard_hide"],
  favori: ["automatic_dashboard_favori", "automatic_dashboard_favorite"],
  exterieur: ["automatic_dashboard_exterieur", "automatic_dashboard_outdoor"],
} as const;
/** L'une de ces étiquettes est-elle posée ? */
export const porte = (etiquettes: readonly string[] | undefined | null, cle: keyof typeof ETIQUETTES): boolean =>
  Boolean(etiquettes?.some((l) => (ETIQUETTES[cle] as readonly string[]).includes(l)));

/** Classe d'un capteur, déduite de son unité quand l'intégration n'en donne pas. */
export function classeDe(etat: EtatHA | undefined): string | undefined {
  const a = etat?.attributes ?? {};
  if (a.device_class) return a.device_class;
  const u = a.unit_of_measurement;
  const nom = String(a.friendly_name ?? "");
  if (u === "°C" || u === "°F") return "temperature";
  if (u === "W" || u === "kW") return "power";
  if (u === "kWh" || u === "Wh" || u === "MWh") return "energy";
  if (u === "VA") return "apparent_power";
  if (u === "lx") return "illuminance";
  if (u === "%" && /humid/i.test(nom)) return "humidity";
  if (u === "ppm" && /co2|co₂/i.test(nom)) return "carbon_dioxide";
  return undefined;
}

/** Juge une entité : l'écarte (avec sa raison) ou lui donne un rôle et une section. */
export function juger(e: Entite, en: EntiteHA, masquer: Set<string>): void {
  const { domaine, classe } = e;
  if (en.hidden) { e.ecart = "masquee"; return; }
  if (masquer.has(e.id)) { e.ecart = "masquee_reglage"; return; }
  if (DOMAINES_TECHNIQUES.has(domaine)) { e.ecart = "domaine_technique"; return; }
  // Mises à jour, piles et plateformes système vont en Système, même rangées en « diagnostic ».
  if (domaine === "update") { e.role = "maintenance"; e.section = "systeme"; return; }
  if ((domaine === "sensor" || domaine === "binary_sensor") && classe === "battery") {
    if (e.mobile) { e.ecart = "pile_telephone"; return; }
    e.role = "maintenance"; e.section = "systeme"; return;
  }
  if (PLATEFORMES_SYSTEME.has(e.plateforme)) { e.role = "systeme"; e.section = "systeme"; return; }
  if (e.categorie) { e.ecart = `categorie_${e.categorie}`; return; }
  if (domaine === "button" && classe && ["identify", "restart", "update"].includes(classe)) { e.ecart = "technique"; return; }
  if (domaine === "sensor" && ((classe && CLASSES_TECHNIQUES.has(classe)) || (e.unite && UNITES_TECHNIQUES.has(e.unite)) || NOM_TECHNIQUE.test(e.nomPropre))) {
    e.ecart = "technique"; return;
  }
  if (AIDES.has(domaine) && !e.piece) { e.ecart = "aide_sans_piece"; return; }

  const donner = (role: Entite["role"], section: Entite["section"], secondaire = false) => {
    e.role = role; e.section = section; e.secondaire = secondaire;
  };
  if (["light", "switch", "fan", "vacuum", "lawn_mower", "valve", "siren", "remote", "input_boolean"].includes(domaine)) donner("commande", "pieces");
  else if (domaine === "cover") donner("commande", classe && ["door", "garage", "gate"].includes(classe) ? "securite" : "pieces");
  else if (domaine === "scene" || domaine === "script" || domaine === "button") donner("commande", "pieces", true);
  else if (["climate", "water_heater", "humidifier"].includes(domaine)) donner("commande", "climat");
  else if (domaine === "media_player") donner("commande", "medias");
  else if (domaine === "lock" || domaine === "alarm_control_panel") donner("commande", "securite");
  else if (domaine === "camera") donner("camera", "securite");
  else if (domaine === "binary_sensor") {
    if (classe && OUVRANTS.has(classe)) donner("ouvrant", "securite");
    else if (classe && ALERTES.has(classe)) donner("alerte", "securite");
    else if (classe && PRESENCES.has(classe)) donner("presence", "securite", true);
    else donner("info", "pieces", true);
  } else if (domaine === "sensor") {
    if (classe && MESURES.has(classe)) donner("mesure", "climat");
    else if (classe && ENERGIE.has(classe)) donner("energie", "energie");
    else if (classe && ENERGIE_SECONDAIRE.has(classe)) donner("energie", "energie", true);
    else if (classe && MESURES_SECONDAIRES.has(classe)) donner("mesure", "pieces", true);
    else donner("info", "pieces", true);
  } else if (domaine === "weather") donner("meteo", "accueil");
  else if (["number", "select", "text", "date", "time", "datetime"].includes(domaine)) donner("reglage", "pieces", true);
  else donner("info", "pieces", true);
}
