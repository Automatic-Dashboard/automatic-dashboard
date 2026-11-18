// Les cartes natives de Home Assistant que la stratégie utilise, en version simple pour la démo :
// titre, tuile, météo, thermostat, courbe et journal. Elles lisent la même maison que les cartes
// Automatic Dashboard, et les tuiles s'allument et s'éteignent pour de vrai.

import { css, html, LitElement, nothing, type PropertyDeclarations, svg, type TemplateResult } from "lit";
import type { EtatHA, HomeAssistant } from "../ha";
import { conditionMeteo, degres, heure, langue, naviguer, nomCourt } from "../outils";
import type { Evenement } from "./maison";
import { TEXTES_DEMO } from "./textes";

type Config = Record<string, any>;
const textes = (hass?: HomeAssistant) => TEXTES_DEMO[langue(hass) === "fr" ? "fr" : "en"];
const BASCULES = new Set(["light", "switch", "fan", "input_boolean", "cover", "lock", "media_player"]);

/** Le journal de la démo : ce que le visiteur a changé, le plus récent d'abord. */
let journal: Evenement[] = [];
export const brancherJournal = (j: Evenement[]): void => {
  journal = j;
};

abstract class CarteNative extends LitElement {
  static override properties: PropertyDeclarations = { hass: { attribute: false }, config: { state: true } };
  declare hass?: HomeAssistant;
  declare config: Config;

  setConfig(config: Config): void {
    this.config = config;
  }

  getGridOptions(): { columns?: number | "full"; rows?: number | "auto" } {
    return { columns: "full", rows: "auto" };
  }

  protected etat(id = String(this.config?.entity ?? "")): EtatHA | undefined {
    return this.hass?.states[id];
  }

  protected infos(id: string): void {
    this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: id }, bubbles: true, composed: true }));
  }
}

const STYLE = css`
  :host{display:block;height:100%;font-family:var(--ha-font-family-body,inherit)}
  ha-card{height:100%;box-sizing:border-box}
  button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer;text-align:left}
`;

class DemoTitre extends CarteNative {
  static override styles = [STYLE, css`
    :host{height:auto}
    .titre{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 2px 0;min-height:36px}
    h2{margin:0;font-size:18px;font-weight:650;letter-spacing:-.01em;color:var(--primary-text-color)}
    h2.sous{font-size:14px;font-weight:600;color:var(--secondary-text-color)}
    .badges{display:flex;gap:6px;flex-wrap:wrap}
    .badge{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 12px;border-radius:15px;font-size:13px;font-weight:600;
      background:var(--secondary-background-color);color:var(--primary-text-color)}
    .badge ha-icon{--mdc-icon-size:16px}
  `];

  private agir(action?: Config): void {
    agirSur(this.hass, action);
  }

  override render() {
    const badges = (this.config.badges ?? []) as Config[];
    return html`<div class="titre"><h2 class=${this.config.heading_style === "subtitle" ? "sous" : ""}>${this.config.heading ?? ""}</h2>
      ${badges.length ? html`<div class="badges">${badges.map((b) => html`<button class="badge" @click=${() => this.agir(b.tap_action)}>
        ${b.icon ? html`<ha-icon .icon=${b.icon}></ha-icon>` : nothing}${b.text ?? ""}</button>`)}</div>` : nothing}</div>`;
  }
}

/** L'action d'un bouton de titre : changer de page, ou un service sur une pièce (« Tout éteindre »). */
function agirSur(hass: HomeAssistant | undefined, action?: Config): void {
  if (!hass || !action) return;
  if (action.action === "navigate" && action.navigation_path) return naviguer(String(action.navigation_path));
  if (action.action !== "perform-action" || !action.perform_action) return;
  const [domaine, service] = String(action.perform_action).split(".");
  const piece = action.target?.area_id;
  const ids = Object.values(hass.entities).filter((e) => e.entity_id.startsWith(`${domaine}.`)
    && (e.area_id ?? hass.devices[e.device_id ?? ""]?.area_id) === piece).map((e) => e.entity_id);
  hass.callService?.(domaine, service, { entity_id: ids });
}

class DemoTuile extends CarteNative {
  static override styles = [STYLE, css`
    button{display:grid;grid-template-columns:auto 1fr;align-items:center;gap:10px;width:100%;height:100%;min-height:54px;padding:8px 12px;box-sizing:border-box}
    .ico{display:grid;place-items:center;width:36px;height:36px;border-radius:var(--tile-icon-border-radius,10px);
      background:var(--secondary-background-color);color:var(--secondary-text-color)}
    .ico.actif{background:color-mix(in srgb, var(--state-icon-active-color, var(--primary-color)) 18%, transparent);color:var(--state-icon-active-color, var(--primary-color))}
    .ico ha-state-icon{--mdc-icon-size:20px}
    .nom{font-size:14px;font-weight:600;line-height:1.25;color:var(--primary-text-color);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .etat{display:block;font-size:12.5px;font-weight:500;color:var(--secondary-text-color)}
  `];

  override getGridOptions() {
    return { columns: 6, rows: 1 } as const;
  }

  override render() {
    const e = this.etat();
    if (!e || !this.hass) return nothing;
    const actif = ["on", "open", "unlocked", "playing", "heat", "cool", "home", "cleaning"].includes(e.state);
    const nom = this.config.name ?? nomCourt(this.hass, e.entity_id);
    return html`<ha-card><button title=${nom} @click=${this.toucher}>
      <span class="ico ${actif ? "actif" : ""}"><ha-state-icon .stateObj=${e} .icon=${this.config.icon}></ha-state-icon></span>
      <span class="nom">${nom}<span class="etat">${this.hass.formatEntityState?.(e) ?? e.state}</span></span></button></ha-card>`;
  }

  private toucher = (): void => {
    const id = String(this.config.entity);
    const domaine = id.split(".")[0];
    if (!BASCULES.has(domaine)) return this.infos(id);
    const e = this.etat()!;
    const service = domaine === "lock" ? (e.state === "locked" ? "unlock" : "lock") : domaine === "media_player" ? "media_play_pause" : "toggle";
    this.hass?.callService?.(domaine, service, { entity_id: id });
  };
}

class DemoMeteo extends CarteNative {
  static override styles = [STYLE, css`
    ha-card{padding:16px 18px;display:grid;gap:14px}
    .haut{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:14px}
    .haut ha-icon{--mdc-icon-size:46px;color:var(--primary-color)}
    .cond{font-size:17px;font-weight:650;color:var(--primary-text-color)}
    .lieu{font-size:13px;color:var(--secondary-text-color)}
    .temp{font-size:30px;font-weight:700;letter-spacing:-.03em;color:var(--primary-text-color)}
    .jours{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;text-align:center;font-size:12.5px;color:var(--secondary-text-color)}
    .jours ha-icon{--mdc-icon-size:22px;color:var(--primary-text-color);margin:4px 0}
    .jours b{display:block;font-size:13.5px;color:var(--primary-text-color)}
  `];

  override render() {
    const e = this.etat();
    if (!e || !this.hass) return nothing;
    const hass = this.hass;
    const { icone, texte } = conditionMeteo(hass, e);
    const t = Number(e.attributes.temperature ?? 15);
    const ciels = ["partlycloudy", "sunny", "cloudy", "rainy", "sunny"];
    const jour = new Intl.DateTimeFormat(langue(hass), { weekday: "short" });
    return html`<ha-card>
      <div class="haut"><ha-icon .icon=${icone}></ha-icon>
        <div><div class="cond">${texte}</div><div class="lieu">${hass.config.location_name ?? ""}</div></div>
        <div class="temp">${degres(hass, t)}</div></div>
      <div class="jours">${ciels.map((c, i) => {
        const d = new Date(Date.now() + (i + 1) * 86_400_000);
        const prevision = conditionMeteo(hass, { entity_id: "weather.demo", state: c, attributes: {} });
        return html`<div>${jour.format(d)}<br><ha-icon .icon=${prevision.icone}></ha-icon><b>${Math.round(t + 2 - i % 3)}°</b>${Math.round(t - 5 + i % 2)}°</div>`;
      })}</div></ha-card>`;
  }
}

class DemoThermostat extends CarteNative {
  static override styles = [STYLE, css`
    ha-card{padding:16px 18px;display:grid;justify-items:center;gap:8px;text-align:center}
    .nom{font-size:14px;font-weight:650;color:var(--primary-text-color)}
    .consigne{display:flex;align-items:center;gap:18px}
    .consigne b{font-size:34px;font-weight:700;letter-spacing:-.03em;color:var(--primary-text-color)}
    .rond{display:grid;place-items:center;width:38px;height:38px;border-radius:50%;background:var(--secondary-background-color);color:var(--primary-text-color)}
    .rond ha-icon{--mdc-icon-size:20px}
    .etat{font-size:12.5px;color:var(--secondary-text-color)}
  `];

  override getGridOptions() {
    return { columns: 6, rows: "auto" } as const;
  }

  override render() {
    const e = this.etat();
    if (!e || !this.hass) return nothing;
    const cible = Number(e.attributes.temperature ?? 20);
    const regler = (pas: number) => this.hass?.callService?.("climate", "set_temperature", { entity_id: e.entity_id, temperature: cible + pas });
    return html`<ha-card><div class="nom">${nomCourt(this.hass, e.entity_id)}</div>
      <div class="consigne"><button class="rond" aria-label="−" @click=${() => regler(-0.5)}><ha-icon icon="mdi:minus"></ha-icon></button>
        <b>${degres(this.hass, cible)}</b>
        <button class="rond" aria-label="+" @click=${() => regler(0.5)}><ha-icon icon="mdi:plus"></ha-icon></button></div>
      <div class="etat">${textes(this.hass).consigne} · ${this.hass.formatEntityState?.(e) ?? e.state}${typeof e.attributes.current_temperature === "number" ? ` · ${degres(this.hass, e.attributes.current_temperature)}` : ""}</div></ha-card>`;
  }
}

class DemoCourbe extends CarteNative {
  static override properties: PropertyDeclarations = { ...CarteNative.properties, _series: { state: true } };
  private declare _series: { nom: string; points: number[]; barres: boolean }[];
  private _cle = "";

  static override styles = [STYLE, css`
    ha-card{padding:14px 16px;display:grid;gap:10px}
    .serie{display:grid;gap:4px}
    .nom{font-size:12.5px;font-weight:600;color:var(--secondary-text-color)}
    svg{width:100%;height:70px;overflow:visible}
    path{fill:none;stroke:var(--primary-color);stroke-width:2;stroke-linejoin:round;stroke-linecap:round;vector-effect:non-scaling-stroke}
    rect{fill:var(--primary-color);opacity:.75}
  `];

  constructor() {
    super();
    this._series = [];
  }

  override render() {
    if (!this.hass) return nothing;
    this.charger();
    if (!this._series.length) return nothing;
    return html`<ha-card>${this._series.map((s) => html`<div class="serie"><span class="nom">${s.nom}</span>${this.dessin(s.points, s.barres)}</div>`)}</ha-card>`;
  }

  private dessin(points: number[], barres: boolean): TemplateResult {
    const min = barres ? 0 : Math.min(...points), max = Math.max(...points), etendue = max - min || 1;
    const x = (i: number) => (i / Math.max(1, points.length - 1)) * 100;
    const y = (v: number) => 66 - ((v - min) / etendue) * 60;
    return barres
      ? html`<svg viewBox="0 0 100 70" preserveAspectRatio="none">${points.map((v, i) => svg`<rect x=${(i / points.length) * 100 + 1} y=${y(v)} width=${100 / points.length - 2} height=${66 - y(v)} rx="1"></rect>`)}</svg>`
      : html`<svg viewBox="0 0 100 70" preserveAspectRatio="none">${svg`<path d=${points.map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`).join(" ")}></path>`}</svg>`;
  }

  private charger(): void {
    const ids = ((this.config.entities ?? []) as (string | { entity: string })[]).map((e) => (typeof e === "string" ? e : e.entity)).slice(0, 4);
    const cle = ids.join(",");
    if (cle === this._cle) return;
    this._cle = cle;
    const statistiques = this.config.type === "statistics-graph";
    const jours = Number(this.config.days_to_show ?? 0);
    const debut = new Date(Date.now() - (jours ? jours * 86_400_000 : Number(this.config.hours_to_show ?? 24) * 3_600_000));
    const periode = statistiques ? String(this.config.period ?? "day") : "hour";
    const barres = statistiques && ((this.config.stat_types as string[] | undefined) ?? []).includes("change");
    this.hass!.callWS<Record<string, Record<string, number>[]>>({ type: "recorder/statistics_during_period", start_time: debut.toISOString(), statistic_ids: ids,
      period: periode, types: barres ? ["change"] : ["mean"] }).then((r) => {
      this._series = ids.map((id) => ({ nom: nomCourt(this.hass!, id), barres, points: (r[id] ?? []).map((p) => (barres ? p.change : p.mean) ?? 0) }))
        .filter((s) => s.points.length > 1);
    });
  }
}

class DemoJournal extends CarteNative {
  static override styles = [STYLE, css`
    ha-card{padding:12px 16px;display:grid;gap:2px}
    .ligne{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:10px;min-height:38px;font-size:13.5px;color:var(--primary-text-color)}
    .ligne ha-state-icon{--mdc-icon-size:18px;color:var(--secondary-text-color)}
    .quand{font-size:12px;color:var(--secondary-text-color)}
    .vide{margin:6px 0;font-size:13.5px;color:var(--secondary-text-color)}
  `];

  override render() {
    if (!this.hass) return nothing;
    const hass = this.hass;
    const lignes = journal.filter((ev) => hass.states[ev.entite]).slice(0, 6);
    return html`<ha-card>${lignes.length ? lignes.map((ev) => {
      const e = { ...hass.states[ev.entite], state: ev.etat };
      return html`<div class="ligne"><ha-state-icon .stateObj=${e}></ha-state-icon>
        <span>${nomCourt(hass, ev.entite)} · ${hass.formatEntityState?.(e) ?? ev.etat}</span><span class="quand">${heure(hass, new Date(ev.quand))}</span></div>`;
    }) : html`<p class="vide">${textes(hass).journalVide}</p>`}</ha-card>`;
  }
}

/** Les cartes natives remplacées : type de Home Assistant → balise de la démo. */
export const NATIVES: Record<string, string> = {
  heading: "demo-titre", tile: "demo-tuile", "weather-forecast": "demo-meteo", thermostat: "demo-thermostat",
  "history-graph": "demo-courbe", "statistics-graph": "demo-courbe", logbook: "demo-journal",
};

export function definirNatives(): void {
  const elements: [string, CustomElementConstructor][] = [["demo-titre", DemoTitre], ["demo-tuile", DemoTuile], ["demo-meteo", DemoMeteo],
    ["demo-thermostat", DemoThermostat], ["demo-courbe", DemoCourbe], ["demo-journal", DemoJournal]];
  for (const [balise, classe] of elements) if (!customElements.get(balise)) customElements.define(balise, classe);
}

