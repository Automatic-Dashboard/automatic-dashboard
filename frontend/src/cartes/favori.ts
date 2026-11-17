// La tuile de favori Automatic Dashboard : comme la tuile de Home Assistant, mais le nom
// tient sur deux lignes (« Réglette du plan de travail » se lit en entier). Un toucher
// allume ou éteint ce qui s'allume, ouvre la fenêtre de l'appareil sinon ; un appui long
// ouvre toujours la fenêtre de l'appareil.

import { css, html, type TemplateResult } from "lit";
import type { HomeAssistant } from "../ha";
import type { Maison } from "../moteur/types";
import { nomCourt, plusDInfos, valide } from "../outils";
import { CarteAutomatic, type OptionsGrille } from "./base";
import { STYLE_COMMUN } from "./styles";

/** Ce qu'un toucher bascule directement. */
const BASCULE = new Set(["light", "switch", "fan", "input_boolean", "siren", "humidifier"]);
const ACTIVES = new Set(["on", "open", "opening", "playing", "heat", "cool", "heat_cool", "auto", "dry", "fan_only", "unlocked", "cleaning", "mowing"]);

export class AutomaticFavori extends CarteAutomatic {
  private _appui?: number;
  private _long = false;

  static override styles = [STYLE_COMMUN, css`
    button.tuile{display:grid;grid-template-columns:auto 1fr;align-items:center;gap:11px;width:100%;height:100%;min-height:56px;
      padding:4px 12px 4px 9px;border-radius:var(--ha-card-border-radius, 12px);box-sizing:border-box;text-align:left;
      background:var(--ha-card-background, var(--card-background-color));border:var(--ha-card-border-width, 1px) solid var(--ha-card-border-color, var(--divider-color));
      box-shadow:var(--ha-card-box-shadow, none);transition:background-color .15s}
    button.tuile:hover{background:color-mix(in srgb, var(--primary-color) 5%, var(--ha-card-background, var(--card-background-color)))}
    .icone{display:grid;place-items:center;width:36px;height:36px;border-radius:var(--ha-tile-icon-border-radius, 10px);
      background:var(--automatic-dashboard-fond-alt, var(--secondary-background-color));color:var(--state-icon-color, var(--secondary-text-color))}
    .actif .icone{background:color-mix(in srgb, var(--couleur) 18%, transparent);color:var(--couleur)}
    .icone ha-state-icon{--mdc-icon-size:21px}
    .texte{min-width:0;display:flex;flex-direction:column;gap:1px}
    /* Deux lignes de nom et l'état tiennent dans la hauteur d'une tuile (56 px). */
    .nom{font-size:13.5px;font-weight:600;line-height:1.1;color:var(--primary-text-color);
      display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere}
    .etat{font-size:11.5px;line-height:1.15;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    @media (prefers-reduced-motion: reduce){ button.tuile{transition:none} }
  `];

  getGridOptions(): OptionsGrille {
    return { columns: 6, rows: 1, min_columns: 4 };
  }

  override suivies(): string[] {
    return this._config?.entity ? [String(this._config.entity)] : [];
  }

  protected override rendu(hass: HomeAssistant, m: Maison): TemplateResult | null {
    const id = String(this._config?.entity ?? "");
    const etat = hass.states[id];
    if (!etat) return null;
    const domaine = id.split(".")[0];
    const actif = ACTIVES.has(etat.state);
    const couleur = domaine === "light" ? "var(--state-light-active-color, #E9A23B)"
      : etat.state === "heat" ? "var(--state-climate-heat-color, #D97A2B)" : etat.state === "cool" ? "var(--state-climate-cool-color, #0288D1)"
      : "var(--state-active-color, var(--primary-color))";
    const nom = String(this._config?.name ?? nomCourt(hass, id, m.noms));
    const texteEtat = valide(etat) && domaine === "light" && etat.state === "on" && typeof etat.attributes.brightness === "number"
      ? `${Math.round((etat.attributes.brightness / 255) * 100)} %`
      : hass.formatEntityState?.(etat) ?? etat.state;
    return html`<button class=${actif ? "tuile actif" : "tuile"} style=${`--couleur:${couleur}`} title=${nom}
      @pointerdown=${this.appuyer} @pointerup=${this.relacher} @pointerleave=${this.annuler} @contextmenu=${(ev: Event) => ev.preventDefault()}
      @keydown=${(ev: KeyboardEvent) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); this.toucher(); } }}>
      <span class="icone"><ha-state-icon .hass=${hass} .stateObj=${etat}></ha-state-icon></span>
      <span class="texte"><span class="nom">${nom}</span><span class="etat">${texteEtat}</span></span>
    </button>`;
  }

  // Un appui long (une demi-seconde) ouvre la fenêtre de l'appareil ; un toucher court agit.
  private appuyer = (): void => {
    this._long = false;
    window.clearTimeout(this._appui);
    this._appui = window.setTimeout(() => {
      this._long = true;
      plusDInfos(this, String(this._config?.entity));
    }, 500);
  };

  private relacher = (ev: PointerEvent): void => {
    window.clearTimeout(this._appui);
    if (!this._long && ev.button === 0) this.toucher();
  };

  private annuler = (): void => window.clearTimeout(this._appui);

  private toucher(): void {
    const id = String(this._config?.entity ?? "");
    const domaine = id.split(".")[0];
    const appeler = this.hass?.callService;
    if (appeler && BASCULE.has(domaine)) appeler(domaine, "toggle", { entity_id: id });
    else if (appeler && (domaine === "scene" || domaine === "script")) appeler(domaine, "turn_on", { entity_id: id });
    else if (appeler && domaine === "cover") appeler("cover", "toggle", { entity_id: id });
    else plusDInfos(this, id);
  }
}
