// Une pièce : Moyen 6×2 par défaut, Petit 4×2 en Complet, Bandeau 12×2 quand elle est
// promue. Des compteurs à icône plutôt qu'une phrase : la hauteur ne bouge jamais.

import { css, html, nothing, type TemplateResult } from "lit";
import type { HomeAssistant } from "../ha";
import type { Maison } from "../moteur/types";
import { premiereValeur } from "../moteur/valeurs";
import { degres, naviguer, nombre, t } from "../outils";
import { CarteAutomatic, type OptionsGrille } from "./base";
import { STYLE_COMMUN } from "./styles";

export class AutomaticPiece extends CarteAutomatic {
  static override styles = [STYLE_COMMUN, css`
    button.carte{display:flex;flex-direction:column;justify-content:space-between;width:100%;height:100%;padding:13px 14px 12px;border-radius:var(--ha-card-border-radius)}
    .haut{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}
    .mesures{text-align:right;line-height:1}
    .temp{font-size:24px;font-weight:650;letter-spacing:-.02em;color:var(--primary-text-color);white-space:nowrap}
    .hum{font-size:12.5px;margin-top:5px}
    .nom{display:flex;align-items:center;gap:6px;font-weight:650;font-size:15.5px;line-height:1.2;color:var(--primary-text-color);
      white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .nom .point{flex:none;width:8px;height:8px;border-radius:50%;background:var(--warning-color)}
    .compteurs{display:flex;gap:11px;margin-top:5px;font-size:12.5px;font-weight:600;color:var(--secondary-text-color);min-height:16px}
    .compteur{display:inline-flex;align-items:center;gap:3px}
    .compteur ha-icon{--mdc-icon-size:15px}
    .compteur.lum{color:var(--state-light-active-color)}
    .compteur.att{color:var(--warning-color)}
    .compteur.chaud ha-icon{color:var(--state-climate-heat-color)}
    .compteur.froid ha-icon{color:var(--state-climate-cool-color)}
    .calme{font-weight:500}
    @container (max-width: 150px){
      button.carte{padding:11px 11px 10px}
      .ico{width:32px;height:32px;border-radius:10px} .ico ha-icon{--mdc-icon-size:18px}
      .temp{font-size:19px} .hum{display:none} .compteurs{display:none}
      .nom{font-size:13.5px;white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;line-height:1.2}
    }
    @container (min-width: 330px){ button.carte{padding:15px 18px 14px} .temp{font-size:30px} .nom{font-size:17px} }
  `];

  getGridOptions(): OptionsGrille {
    return { columns: 6, rows: 2, min_columns: 4, max_columns: 12, min_rows: 2, max_rows: 2 };
  }

  override suivies(m: Maison): string[] {
    const p = m.pieces.find((x) => x.area_id === this._config?.piece);
    return p ? [...p.temperatures, ...p.humidites, ...p.entites.map((e) => e.id)] : [];
  }

  protected override rendu(hass: HomeAssistant, m: Maison): TemplateResult | null {
    const tx = t(hass);
    const p = m.pieces.find((x) => x.area_id === this._config?.piece);
    if (!p) return null;
    const etat = (id: string) => hass.states[id]?.state ?? "";
    const temp = premiereValeur(hass, p.temperatures);
    const hum = premiereValeur(hass, p.humidites);
    const lum = p.entites.filter((e) => e.domaine === "light" && etat(e.id) === "on").length;
    const vol = p.entites.filter((e) => e.domaine === "cover" && etat(e.id) === "open").length;
    const ouverts = p.entites.filter((e) => e.role === "ouvrant" && etat(e.id) === "on").length;
    const chauffe = p.entites.some((e) => e.domaine === "climate" && ["heat", "heat_cool", "auto"].includes(etat(e.id)));
    const froid = p.entites.some((e) => e.domaine === "climate" && etat(e.id) === "cool");
    const media = p.entites.some((e) => e.domaine === "media_player" && etat(e.id) === "playing");
    const compteurs = [
      lum ? html`<span class="compteur lum"><ha-icon icon="mdi:lightbulb-on"></ha-icon>${lum}</span>` : null,
      vol ? html`<span class="compteur"><ha-icon icon="mdi:window-shutter-open"></ha-icon>${vol}</span>` : null,
      ouverts ? html`<span class="compteur att"><ha-icon icon="mdi:window-open-variant"></ha-icon>${ouverts}</span>` : null,
      chauffe ? html`<span class="compteur chaud"><ha-icon icon="mdi:radiator"></ha-icon></span>` : null,
      froid ? html`<span class="compteur froid"><ha-icon icon="mdi:snowflake"></ha-icon></span>` : null,
      media ? html`<span class="compteur"><ha-icon icon="mdi:music"></ha-icon></span>` : null,
    ].filter((c) => c !== null);
    const nb = p.entites.filter((e) => !e.secondaire).length;
    return html`<ha-card><button class="carte" title=${p.name} @click=${() => naviguer(this._config?.piece ?? "")}>
      <span class="haut"><span class="ico ${lum ? "chaud" : ""}"><ha-icon icon=${p.icon}></ha-icon></span>
        <span class="mesures">${temp !== null ? html`<div class="temp chiffre">${degres(hass, temp)}</div>` : nothing}
        ${hum !== null ? html`<div class="hum doux chiffre">${nombre(hass, hum, 0)} %</div>` : nothing}</span></span>
      <span><span class="nom">${p.name}${ouverts ? html`<span class="point"></span>` : nothing}</span>
        <span class="compteurs">${compteurs.length ? compteurs : html`<span class="calme">${temp === null ? `${nb} ${tx.appareils.toLowerCase()}` : tx.toutEteint}</span>`}</span></span>
    </button></ha-card>`;
  }
}
