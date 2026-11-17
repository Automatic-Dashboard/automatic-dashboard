// Le confort : une ligne par pièce, sa température sur une barre de 14 à 28 °C, la zone
// de confort (19 à 22 °C) en vert pâle, son humidité et ce qui chauffe ou refroidit.

import { css, html, nothing, type TemplateResult } from "lit";
import { styleMap } from "lit/directives/style-map.js";
import type { HomeAssistant } from "../ha";
import type { Maison } from "../moteur/types";
import { premiereValeur } from "../moteur/valeurs";
import { degres, naviguer, nombre } from "../outils";
import { CarteAutomatic, type OptionsGrille } from "./base";
import { STYLE_COMMUN } from "./styles";

const MIN = 14, MAX = 28, BAS = 19, HAUT = 22;

export class AutomaticConfort extends CarteAutomatic {
  static override styles = [STYLE_COMMUN, css`
    ha-card{padding:8px 18px}
    .ligne{display:grid;grid-template-columns:minmax(90px,1.1fr) 62px minmax(90px,2.4fr) 48px 22px;align-items:center;gap:12px;min-height:44px;
      border-top:1px solid var(--divider-color);cursor:pointer}
    .ligne:first-child{border-top:0}
    .nom{font-weight:600;font-size:14.5px;color:var(--primary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .temp{font-size:16px;font-weight:650;text-align:right;color:var(--primary-text-color)}
    .echelle{position:relative;height:8px;border-radius:999px;background:var(--automatic-dashboard-fond-alt, var(--secondary-background-color))}
    .zone{position:absolute;top:0;bottom:0;border-radius:999px;background:var(--automatic-dashboard-vert-pale, color-mix(in srgb, var(--success-color, #1E6B47) 12%, transparent));box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--automatic-dashboard-vert, var(--success-color, #1E6B47)) 30%, transparent)}
    .point{position:absolute;top:50%;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;border:2px solid var(--ha-card-background);background:var(--primary-color)}
    .point.froid{background:var(--state-climate-cool-color)} .point.chaud{background:var(--state-climate-heat-color)}
    .hum{font-size:12.5px;text-align:right}
    .etat ha-icon{--mdc-icon-size:18px}
    .chauffe{color:var(--state-climate-heat-color)} .refroidit{color:var(--state-climate-cool-color)}
    .graduations{display:grid;grid-template-columns:minmax(90px,1.1fr) 62px minmax(90px,2.4fr) 48px 22px;gap:12px;font-size:11px;color:var(--secondary-text-color);padding:2px 0 6px}
    .graduations .g{display:flex;justify-content:space-between}
    @container (max-width: 520px){
      .ligne,.graduations{grid-template-columns:minmax(70px,1fr) 52px minmax(70px,1.6fr) 22px}
      .hum{display:none}
    }
  `];

  getGridOptions(): OptionsGrille {
    return { columns: "full", rows: "auto" };
  }

  override suivies(m: Maison): string[] {
    return m.pieces.flatMap((p) => [...p.temperatures, ...p.humidites, ...p.entites.filter((e) => e.domaine === "climate").map((e) => e.id)]);
  }

  protected override rendu(hass: HomeAssistant, m: Maison): TemplateResult | null {
    const etat = (id: string) => hass.states[id]?.state ?? "";
    const lignes = m.pieces.filter((p) => !p.exterieur && !p.annexe && p.temperatures.length).map((p) => {
      const temp = premiereValeur(hass, p.temperatures);
      const hum = premiereValeur(hass, p.humidites);
      const chauffe = p.entites.some((e) => e.domaine === "climate" && ["heat", "heat_cool", "auto"].includes(etat(e.id)));
      const froid = p.entites.some((e) => e.domaine === "climate" && etat(e.id) === "cool");
      return { p, temp, hum, chauffe, froid, ecart: temp === null ? -1 : temp < BAS ? BAS - temp : temp > HAUT ? temp - HAUT : 0 };
    }).filter((l): l is typeof l & { temp: number } => l.temp !== null);
    if (lignes.length < 2) return null;
    // Les pièces les plus loin de la zone de confort d'abord.
    lignes.sort((a, b) => b.ecart - a.ecart);
    const pos = (v: number) => `${((Math.max(MIN, Math.min(MAX, v)) - MIN) / (MAX - MIN)) * 100}%`;
    return html`<ha-card>${lignes.map((l) => html`<div class="ligne" @click=${() => naviguer(l.p.area_id)}>
      <span class="nom">${l.p.name}</span><span class="temp chiffre">${degres(hass, l.temp)}</span>
      <span class="echelle"><span class="zone" style=${styleMap({ left: pos(BAS), right: `calc(100% - ${pos(HAUT)})` })}></span>
        <span class="point ${l.temp < BAS ? "froid" : l.temp > HAUT ? "chaud" : ""}" style=${styleMap({ left: pos(l.temp) })}></span></span>
      <span class="hum doux chiffre">${l.hum !== null ? `${nombre(hass, l.hum, 0)} %` : nothing}</span>
      <span class="etat">${l.chauffe ? html`<ha-icon class="chauffe" icon="mdi:radiator"></ha-icon>` : l.froid ? html`<ha-icon class="refroidit" icon="mdi:snowflake"></ha-icon>` : nothing}</span></div>`)}<div class="graduations"><span></span><span></span><span class="g"><span>${MIN}°</span><span>${BAS}°</span><span>${HAUT}°</span><span>${MAX}°</span></span><span></span><span></span></div></ha-card>`;
  }
}
