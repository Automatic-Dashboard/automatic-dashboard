// La maison de la démo : l'appartement d'essai « famille » (tests/fixtures/famille.json), rendu
// vivant dans la page. Les heures sont recalées sur maintenant, le soleil se lève et se couche
// pour de vrai, les services (allumer, ouvrir, verrouiller…) changent les états, et les courbes
// et statistiques demandées par les cartes sont fabriquées à partir des valeurs du moment.

import type { EtatHA, HomeAssistant } from "../ha";
import famille from "../../tests/fixtures/famille.json";
import { TEXTES_DEMO } from "./textes";

type Langue = "fr" | "en";
export interface Evenement { quand: number; entite: string; etat: string }

const MINUTE = 60_000;
const JOUR = 24 * 60 * MINUTE;

/** Une graine stable par entité : les courbes ne changent pas d'un affichage à l'autre. */
function graine(texte: string): number {
  let h = 2166136261;
  for (const c of texte) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0) / 4294967296;
}

/** Le lever et le coucher du soleil d'un jour, pour une latitude et une longitude (formules de la NOAA). */
export function soleil(jour: Date, lat: number, lon: number): { lever: Date; coucher: Date } {
  const rad = Math.PI / 180;
  const minuit = Date.UTC(jour.getFullYear(), jour.getMonth(), jour.getDate());
  const n = Math.round((minuit - Date.UTC(jour.getFullYear(), 0, 1)) / JOUR) + 1;
  const g = ((2 * Math.PI) / 365) * (n - 1);
  const equation = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const declinaison = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g)
    - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const angle = Math.acos(Math.cos(90.833 * rad) / (Math.cos(lat * rad) * Math.cos(declinaison)) - Math.tan(lat * rad) * Math.tan(declinaison)) / rad;
  return { lever: new Date(minuit + (720 - 4 * (lon + angle) - equation) * MINUTE), coucher: new Date(minuit + (720 - 4 * (lon - angle) - equation) * MINUTE) };
}

const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/;
const LOCALE = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/;
const deux = (n: number) => String(n).padStart(2, "0");

/** Décale une date écrite en texte (ISO, ou heure locale « 2026-11-16 21:44:57 »), sinon la rend telle quelle. */
function decaler(v: unknown, decalage: number): unknown {
  if (typeof v !== "string") return v;
  if (ISO.test(v)) return new Date(new Date(v).getTime() + decalage).toISOString();
  const m = LOCALE.exec(v);
  if (!m) return v;
  const d = new Date(new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]).getTime() + decalage);
  return `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())} ${deux(d.getHours())}:${deux(d.getMinutes())}:${deux(d.getSeconds())}`;
}

export class MaisonDemo {
  hass!: HomeAssistant;
  readonly journal: Evenement[] = [];
  private readonly ecouteurs = new Set<(hass: HomeAssistant) => void>();
  private readonly donneesUtilisateur = new Map<string, unknown>();
  private readonly abonnes = new Map<string, Set<(m: { value?: unknown }) => void>>();
  private readonly depart: Record<string, EtatHA>;

  constructor(readonly langue: Langue, private readonly sombre: () => boolean) {
    const base = structuredClone(famille) as unknown as HomeAssistant;
    // Les heures de la maison d'essai, recalées pour que « il y a 19 minutes » reste vrai maintenant.
    const capture = Math.max(...Object.values(base.states).map((e) => new Date(e.last_changed ?? 0).getTime()).filter((t) => !Number.isNaN(t)));
    const decalage = Date.now() - 2 * MINUTE - capture;
    const noms = TEXTES_DEMO[langue].noms;
    for (const e of Object.values(base.states)) {
      e.last_changed = decaler(e.last_changed, decalage) as string;
      e.last_updated = decaler(e.last_updated, decalage) as string;
      e.state = decaler(e.state, decalage) as string;
      for (const [cle, valeur] of Object.entries(e.attributes)) e.attributes[cle] = decaler(valeur, decalage);
      const nom = e.attributes.friendly_name;
      if (typeof nom === "string") e.attributes.friendly_name = noms[nom] ?? nom.replace(" (essai)", "");
      if (typeof e.attributes.message === "string") e.attributes.message = noms[e.attributes.message] ?? e.attributes.message;
    }
    for (const a of Object.values(base.areas)) a.name = noms[a.name] ?? a.name;
    for (const d of Object.values(base.devices)) {
      if (d.name) d.name = noms[d.name] ?? d.name;
      if (d.name_by_user) d.name_by_user = noms[d.name_by_user] ?? d.name_by_user;
    }
    for (const e of Object.values(base.entities)) if (e.name) e.name = noms[e.name] ?? e.name;
    base.config = { ...base.config, location_name: noms[base.config.location_name ?? ""] ?? base.config.location_name, unit_system: { temperature: "°C" } };
    this.depart = structuredClone(base.states);
    this.hass = this.construire(base, base.states);
    this.mettreLeSoleil();
  }

  /** S'abonne aux changements : chaque changement donne un nouvel objet hass, comme dans Home Assistant. */
  suivre(f: (hass: HomeAssistant) => void): () => void {
    this.ecouteurs.add(f);
    return () => this.ecouteurs.delete(f);
  }

  /** Change l'état d'une entité (et ses attributs), puis prévient les cartes. */
  changer(id: string, etat: string, attributs: Record<string, unknown> = {}): void {
    const ancien = this.hass.states[id];
    if (!ancien) return;
    const maintenant = new Date().toISOString();
    const nouveau: EtatHA = { ...ancien, state: etat, attributes: { ...ancien.attributes, ...attributs }, last_updated: maintenant,
      last_changed: etat !== ancien.state ? maintenant : ancien.last_changed };
    if (etat !== ancien.state) this.journal.unshift({ quand: Date.now(), entite: id, etat });
    this.publier({ ...this.hass.states, [id]: nouveau });
  }

  /** L'état d'une entité au début de la démo. */
  etatDeDepart(id: string): string {
    return this.depart[id]?.state ?? "";
  }

  /** Remet la maison comme au début de la démo. */
  remettre(): void {
    this.journal.length = 0;
    this.publier(structuredClone(this.depart));
    this.mettreLeSoleil();
  }

  /** Le soleil d'aujourd'hui, à l'heure du visiteur. */
  mettreLeSoleil(): void {
    const { latitude, longitude } = this.hass.config;
    const maintenant = new Date();
    const auj = soleil(maintenant, latitude, longitude);
    const dem = soleil(new Date(maintenant.getTime() + JOUR), latitude, longitude);
    const prochain = (a: Date, b: Date) => (maintenant < a ? a : b).toISOString();
    const leve = maintenant >= auj.lever && maintenant < auj.coucher;
    if (this.hass.states["sun.sun"]) {
      this.changer("sun.sun", leve ? "above_horizon" : "below_horizon",
        { next_rising: prochain(auj.lever, dem.lever), next_setting: prochain(auj.coucher, dem.coucher), rising: maintenant < auj.lever });
    }
  }

  private publier(etats: Record<string, EtatHA>, registres: Partial<HomeAssistant> = {}): void {
    this.hass = this.construire({ ...this.hass, ...registres }, etats);
    for (const f of this.ecouteurs) f(this.hass);
  }

  private construire(base: HomeAssistant, etats: Record<string, EtatHA>): HomeAssistant {
    const tx = TEXTES_DEMO[this.langue];
    const nombre = new Intl.NumberFormat(this.langue, { maximumFractionDigits: 1 });
    return {
      ...base,
      states: etats,
      user: { id: "demo", name: tx.utilisateur, is_admin: true },
      locale: { language: this.langue, time_format: "language" },
      language: this.langue,
      themes: { darkMode: this.sombre() },
      callService: (d, s, donnees) => this.service(d, s, donnees ?? {}),
      callWS: <T>(message: Record<string, unknown>) => this.ws(message) as Promise<T>,
      connection: {
        subscribeMessage: (rappel: (m: { value?: unknown }) => void, message: { type: string; key?: string }) => {
          if (message.type === "frontend/subscribe_user_data" && message.key) {
            if (!this.abonnes.has(message.key)) this.abonnes.set(message.key, new Set());
            this.abonnes.get(message.key)!.add(rappel);
            rappel({ value: this.donneesUtilisateur.get(message.key) ?? null });
          }
          return Promise.resolve(() => undefined);
        },
        subscribeEvents: () => Promise.resolve(() => undefined),
      },
      localize: () => "",
      formatEntityState: (e: EtatHA) => {
        const v = Number.parseFloat(e.state);
        const unite = e.attributes.unit_of_measurement;
        if (!Number.isNaN(v) && /^-?[\d.]+$/.test(e.state)) return `${nombre.format(v)}${unite ? ` ${unite}` : ""}`;
        const classe = String(e.attributes.device_class ?? e.entity_id.split(".")[0]);
        return tx.etats[`${classe}.${e.state}`] ?? tx.etats[e.state] ?? e.state;
      },
    } as HomeAssistant;
  }

  // Les services de Home Assistant dont les cartes se servent.
  private async service(_domaine: string, service: string, donnees: Record<string, unknown>): Promise<void> {
    const ids = ([] as string[]).concat((donnees.entity_id as string | string[] | undefined) ?? []);
    for (const id of ids) {
      const e = this.hass.states[id];
      if (!e) continue;
      const [d] = id.split(".");
      const bascule = (oui: string, non: string) => (e.state === oui ? non : oui);
      const quoi = service;
      if (["light", "switch", "fan", "input_boolean", "humidifier", "siren"].includes(d)) {
        const etat = quoi === "toggle" ? bascule("on", "off") : quoi === "turn_on" ? "on" : "off";
        this.changer(id, etat, d === "light" && etat === "on" && !e.attributes.brightness ? { brightness: 180 } : {});
      } else if (d === "cover") {
        const ouvert = quoi === "toggle" ? e.state !== "open" : quoi === "open_cover";
        this.changer(id, ouvert ? "open" : "closed", { current_position: ouvert ? 100 : 0 });
      } else if (d === "lock") {
        this.changer(id, quoi === "unlock" || quoi === "open" ? "unlocked" : "locked");
      } else if (d === "alarm_control_panel") {
        this.changer(id, quoi.startsWith("alarm_arm_") ? quoi.replace("alarm_arm_", "armed_") : "disarmed");
      } else if (d === "climate") {
        if (quoi === "set_temperature" && typeof donnees.temperature === "number") this.changer(id, e.state, { temperature: donnees.temperature });
        else if (quoi === "set_hvac_mode") this.changer(id, String(donnees.hvac_mode));
        else this.changer(id, quoi === "turn_off" ? "off" : "heat");
      } else if (d === "media_player") {
        this.changer(id, quoi === "media_play_pause" ? bascule("playing", "paused") : quoi === "media_pause" ? "paused" : "playing");
      } else if (d === "vacuum") {
        this.changer(id, quoi === "start" ? "cleaning" : "docked");
      }
    }
  }

  // Les messages WebSocket : courbes, statistiques, réglages Énergie, données de l'utilisateur, registres.
  private async ws(m: Record<string, unknown>): Promise<unknown> {
    const type = String(m.type);
    if (type === "frontend/get_user_data") return { value: this.donneesUtilisateur.get(String(m.key)) ?? null };
    if (type === "frontend/set_user_data") {
      this.donneesUtilisateur.set(String(m.key), m.value);
      for (const rappel of this.abonnes.get(String(m.key)) ?? []) rappel({ value: m.value });
      return null;
    }
    if (type === "config/device_registry/update" || type === "config/entity_registry/update") return this.ranger(m);
    if (type === "recorder/statistics_during_period") return this.statistiques(m);
    if (type === "recorder/statistic_during_period") return this.variation(String(m.statistic_id));
    if (type === "history/history_during_period") return this.historique(m);
    if (type === "energy/get_prefs" || type === "energy/info") return {};
    return null;
  }

  /** « À ranger » : l'appareil (ou l'entité) change de pièce, et le tableau suit. */
  private ranger(m: Record<string, unknown>): unknown {
    const piece = (m.area_id as string | null) ?? null;
    if (m.device_id) {
      const id = String(m.device_id);
      this.publier(this.hass.states, { devices: { ...this.hass.devices, [id]: { ...this.hass.devices[id], area_id: piece } } });
    } else {
      const id = String(m.entity_id);
      this.publier(this.hass.states, { entities: { ...this.hass.entities, [id]: { ...this.hass.entities[id], area_id: piece } } });
    }
    return {};
  }

  /** La valeur d'une entité à un instant, autour de sa valeur actuelle : une journée plausible. */
  private valeurA(id: string, quand: number): number {
    const e = this.hass.states[id];
    const actuelle = Number.parseFloat(e?.state ?? "") || 0;
    const classe = e?.attributes.device_class;
    const g = graine(id);
    const heure = new Date(quand).getHours() + new Date(quand).getMinutes() / 60;
    const journe = Math.sin(((heure - 10) / 24) * 2 * Math.PI);
    const bruit = Math.sin(quand / 900_000 + g * 40) * 0.5 + Math.sin(quand / 2_700_000 + g * 13) * 0.5;
    const maintenant = Math.sin(((new Date().getHours() + new Date().getMinutes() / 60 - 10) / 24) * 2 * Math.PI);
    if (classe === "temperature") {
      const amplitude = /ext|outdoor|outside|dehors/i.test(id) ? 4 : 0.7;
      return actuelle + amplitude * (journe - maintenant) + bruit * 0.15;
    }
    if (classe === "humidity") return actuelle + 4 * (maintenant - journe) + bruit;
    if (classe === "power") return Math.max(0, actuelle * (0.75 + 0.35 * (bruit + 1)) + (heure > 18 && heure < 22 ? actuelle * 0.6 : 0));
    return actuelle + bruit;
  }

  private statistiques(m: Record<string, unknown>): Record<string, unknown[]> {
    const debut = new Date(String(m.start_time)).getTime();
    const fin = m.end_time ? new Date(String(m.end_time)).getTime() : Date.now();
    const pas = { "5minute": 5 * MINUTE, hour: 60 * MINUTE, day: JOUR, week: 7 * JOUR, month: 30 * JOUR }[String(m.period)] ?? 60 * MINUTE;
    const types = (m.types as string[] | undefined) ?? ["mean"];
    const resultat: Record<string, unknown[]> = {};
    for (const id of (m.statistic_ids as string[]) ?? []) {
      const points: unknown[] = [];
      const energie = this.hass.states[id]?.attributes.device_class === "energy" || /energ|cout|cost|monetary/i.test(id);
      for (let t = Math.ceil(debut / pas) * pas; t < Math.min(fin, Date.now()); t += pas) {
        const point: Record<string, number> = { start: t, end: t + pas };
        if (energie) {
          // L'énergie d'une période : environ 9 kWh par jour, un peu plus le week-end.
          const g = graine(`${id}${Math.floor(t / JOUR)}`);
          const parJour = 7.5 + 4 * g + ([0, 6].includes(new Date(t).getDay()) ? 2 : 0);
          point.change = (parJour * pas) / JOUR * (/cout|cost|monetary/i.test(id) ? 0.25 : 1);
        } else {
          const v = this.valeurA(id, t);
          if (types.includes("mean")) point.mean = v;
          if (types.includes("min")) point.min = v - (pas >= JOUR ? 2.5 : 0.2);
          if (types.includes("max")) point.max = v + (pas >= JOUR ? 2.5 : 0.2);
        }
        points.push(point);
      }
      resultat[id] = points;
    }
    return resultat;
  }

  /** L'énergie d'aujourd'hui : ce qu'une journée ordinaire a consommé jusqu'à maintenant. */
  private variation(id: string): { change: number } {
    const heures = new Date().getHours() + new Date().getMinutes() / 60;
    return { change: Math.round((8.5 + 3 * graine(id)) * (heures / 24) * 100) / 100 };
  }

  /** L'historique des ouvertures : deux ou trois ouvertures par jour, à des heures plausibles. */
  private historique(m: Record<string, unknown>): Record<string, { s: string; lu: number }[]> {
    const debut = new Date(String(m.start_time)).getTime();
    const fin = m.end_time ? new Date(String(m.end_time)).getTime() : Date.now();
    const resultat: Record<string, { s: string; lu: number }[]> = {};
    for (const id of (m.entity_ids as string[]) ?? []) {
      const liste: { s: string; lu: number }[] = [{ s: "off", lu: debut / 1000 }];
      for (let jour = Math.floor(debut / JOUR) * JOUR; jour < fin; jour += JOUR) {
        const n = 1 + Math.floor(graine(`${id}${jour}`) * 3);
        for (let i = 0; i < n; i++) {
          const t = jour + (7 + i * 5 + graine(`${id}${jour}${i}`) * 3) * 60 * MINUTE;
          if (t > debut && t + 20 * MINUTE < fin) liste.push({ s: "on", lu: t / 1000 }, { s: "off", lu: (t + 20 * MINUTE) / 1000 });
        }
      }
      resultat[id] = liste;
    }
    return resultat;
  }
}
