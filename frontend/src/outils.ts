// Petits outils partagés : langue, nombres, dates, navigation dans Home Assistant.

import type { EtatHA, HomeAssistant } from "./ha";
import type { Langue } from "./langues/langue";
import { ICONES_METEO, LANGUES, SECOURS } from "./textes";

export const langue = (hass?: HomeAssistant): string => (hass?.locale?.language || hass?.language || "fr").slice(0, 2);
export const estFrancais = (hass?: HomeAssistant): boolean => langue(hass) === "fr";
/** Les textes dans la langue de l'utilisateur, sinon en anglais. */
export const langueDe = (hass?: HomeAssistant): Langue => LANGUES[langue(hass)] ?? SECOURS;
export const t = (hass?: HomeAssistant) => langueDe(hass).textes;
export const mh = (hass?: HomeAssistant) => langueDe(hass).heros;

export const nombre = (hass: HomeAssistant | undefined, v: number, chiffres = 1): string =>
  new Intl.NumberFormat(hass?.locale?.language || "fr", { maximumFractionDigits: chiffres, minimumFractionDigits: chiffres }).format(v);
export const degres = (hass: HomeAssistant | undefined, v: number): string => `${nombre(hass, v, 1)}°`;
/**
 * L'heure sur 12 heures ? Selon le format choisi dans le profil Home Assistant : « 12 », « 24 »,
 * celui de l'appareil (« system »), sinon celui de la langue (undefined).
 */
export function douzeHeures(hass: HomeAssistant | undefined): boolean | undefined {
  const format = hass?.locale?.time_format;
  if (format === "12") return true;
  if (format === "24") return false;
  if (format === "system") return new Intl.DateTimeFormat(undefined, { hour: "numeric" }).resolvedOptions().hour12;
  return undefined;
}
/** « 7 h 34 » en français, « 7:34 AM » ou « 07:34 » en anglais, selon le format choisi dans Home Assistant. */
export const heure = (hass: HomeAssistant | undefined, date: Date): string => {
  const douze = douzeHeures(hass);
  return estFrancais(hass) && !douze
    ? `${date.getHours()} h ${String(date.getMinutes()).padStart(2, "0")}`
    : new Intl.DateTimeFormat(hass?.locale?.language || "en", { hour: "numeric", minute: "2-digit", hour12: douze }).format(date);
};
export const majuscule = (s: string): string => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
export const valide = (etat?: EtatHA): etat is EtatHA => Boolean(etat) && !["unknown", "unavailable"].includes(etat!.state);

/** « il y a 3 heures », « dans 2 jours »… dans la langue de l'utilisateur. */
export function ilYa(hass: HomeAssistant | undefined, date: Date): string {
  const rtf = new Intl.RelativeTimeFormat(langue(hass), { numeric: "auto" });
  const minutes = Math.round((date.getTime() - Date.now()) / 60000);
  if (Math.abs(minutes) < 60) return rtf.format(minutes, "minute");
  const heures = Math.round(minutes / 60);
  return Math.abs(heures) < 36 ? rtf.format(heures, "hour") : rtf.format(Math.round(heures / 24), "day");
}

export function conditionMeteo(hass: HomeAssistant | undefined, etat?: EtatHA): { icone: string; texte: string } {
  const cle = etat?.state ?? "";
  return { icone: ICONES_METEO[cle] ?? "mdi:weather-cloudy", texte: langueDe(hass).meteo[cle] ?? cle };
}

/** Navigue dans Home Assistant. Un chemin relatif reste dans le tableau courant. */
export function naviguer(chemin: string): void {
  const cible = chemin.startsWith("/") ? chemin : `/${location.pathname.split("/")[1]}/${chemin}`;
  history.pushState(null, "", cible);
  window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
}

/** Ouvre la fenêtre « plus d'infos » native d'une entité. */
export function plusDInfos(element: HTMLElement, entityId: string): void {
  element.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true }));
}

/** Nom d'affichage court : celui choisi dans les réglages, sinon celui de l'appareil quand l'entité en a un. */
export function nomCourt(hass: HomeAssistant, entityId: string, noms: Record<string, string> = {}): string {
  if (noms[entityId]) return noms[entityId];
  const appareil = hass.devices?.[hass.entities[entityId]?.device_id ?? ""];
  return appareil?.name_by_user || appareil?.name || hass.states[entityId]?.attributes.friendly_name || entityId;
}

/** Les noms de marque des intégrations, quand Home Assistant ne fournit pas le leur (chargé à la demande). */
const MARQUES: Record<string, string> = {
  mqtt: "MQTT",
  zha: "Zigbee (ZHA)",
  matter: "Matter",
  hue: "Philips Hue",
  esphome: "ESPHome",
  hassio: "Supervisor",
  glances: "Glances",
  uptime_kuma: "Uptime Kuma",
  adguard: "AdGuard Home",
  pi_hole: "Pi-hole",
  speedtestdotnet: "Speedtest",
  proxmoxve: "Proxmox VE",
  synology_dsm: "Synology DSM",
  unifi: "UniFi Network",
  truenas: "TrueNAS",
  fritz: "FRITZ!Box",
  netdata: "Netdata",
};

/** Le nom d'une intégration, dans la langue de l'utilisateur. */
export function nomIntegration(hass: HomeAssistant, plateforme: string): string {
  const connu = langueDe(hass).integrations[plateforme] ?? MARQUES[plateforme];
  return hass.localize?.(`component.${plateforme}.title`) || connu || majuscule(plateforme.replace(/_/g, " "));
}

/** La trame de la marque : petits carrés de 2,8 px tous les 22 px, en image CSS. */
export function trame(hass?: HomeAssistant): string {
  const couleur = hass?.themes?.darkMode ? "%23FFFFFF" : "%230277BD";
  const opacite = hass?.themes?.darkMode ? "0.12" : "0.30";
  return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='22' height='22'%3E%3Crect width='2.8' height='2.8' fill='${couleur}' fill-opacity='${opacite}'/%3E%3C/svg%3E")`;
}

/** Phase de la lune, calculée sans internet (cycle moyen de 29,53 jours ; précision d'environ un jour). */
export function phaseLune(date: Date, lg: string): { icone: string; nom: string; pleine: string } {
  const cycle = 29.530588853;
  const age = ((((date.getTime() - Date.UTC(2000, 0, 6, 18, 14)) / 86400000) % cycle) + cycle) % cycle;
  const phases: [string, string, string][] = [
    ["mdi:moon-new", "Nouvelle lune", "New moon"], ["mdi:moon-waxing-crescent", "Premier croissant", "Waxing crescent"],
    ["mdi:moon-first-quarter", "Premier quartier", "First quarter"], ["mdi:moon-waxing-gibbous", "Gibbeuse croissante", "Waxing gibbous"],
    ["mdi:moon-full", "Pleine lune", "Full moon"], ["mdi:moon-waning-gibbous", "Gibbeuse décroissante", "Waning gibbous"],
    ["mdi:moon-last-quarter", "Dernier quartier", "Last quarter"], ["mdi:moon-waning-crescent", "Dernier croissant", "Waning crescent"],
  ];
  const [icone, fr, en] = phases[Math.floor(((age + cycle / 16) % cycle) / (cycle / 8))];
  const jours = Math.round((((cycle / 2 - age) % cycle) + cycle) % cycle);
  const pleine = lg === "fr"
    ? (jours === 0 ? "pleine lune ce soir" : `pleine lune dans ${jours} jour${jours > 1 ? "s" : ""}`)
    : (jours === 0 ? "full moon tonight" : `full moon in ${jours} day${jours > 1 ? "s" : ""}`);
  return { icone, nom: lg === "fr" ? fr : en, pleine };
}
