// Les points à regarder : une liste à filets, sans titre de section ; elle disparaît
// quand tout va bien.

import { css, html, nothing, type TemplateResult } from "lit";
import type { HomeAssistant } from "../ha";
import { type Point, pointsARegarder } from "../moteur/points";
import type { Maison } from "../moteur/types";
import { majuscule, naviguer, plusDInfos, t } from "../outils";
import { CarteCentralHome, definis, type OptionsGrille } from "./base";
import { STYLE_COMMUN } from "./styles";

export class CentralHomePoints extends CarteCentralHome {
  static override styles = [STYLE_COMMUN, css`
    ha-card{padding:6px 16px}
    ha-card.grave{background:var(--centralhome-alerte-pale);border-color:transparent}
    ul{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr;column-gap:28px}
    @container (min-width: 640px){ ul{grid-template-columns:1fr 1fr} }
    li{border-top:1px solid var(--divider-color)}
    li:first-child{border-top:0}
    @container (min-width: 640px){ li:nth-child(2){border-top:0} }
    li button{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:13px;width:100%;min-height:58px;padding:9px 0}
    .n3 .ico{background:var(--centralhome-alerte-pale);color:var(--centralhome-alerte)}
    .n2 .ico{background:rgba(233,162,59,.16);color:var(--warning-color)}
    .n1 .ico{background:var(--centralhome-accent-pale);color:var(--primary-color)}
    .nom{font-weight:650;font-size:14.5px;line-height:1.25;color:var(--primary-text-color)}
    .nom small{display:block;font-weight:500;font-size:13px;color:var(--secondary-text-color);margin-top:2px}
    .fleche{--mdc-icon-size:18px;color:var(--secondary-text-color)}
    .plus{display:block;padding:8px 0 10px;font-size:13px;color:var(--secondary-text-color)}
  `];

  getGridOptions(): OptionsGrille {
    return { columns: "full", rows: "auto" };
  }

  override suivies(m: Maison): string[] {
    return definis([m.vigilance, ...[...m.alertes, ...m.ouvrants, ...m.piles, ...m.majs, ...m.systeme].map((e) => e.id)]);
  }

  protected override rendu(hass: HomeAssistant, m: Maison): TemplateResult | null {
    const tx = t(hass);
    const points = pointsARegarder(hass, m);
    if (!points.length) return null;
    const plafond = m.mode === "complet" ? 4 : m.mode === "maison" ? 4 : 3;
    const montres = points.slice(0, plafond);
    const reste = points.length - montres.length;
    return html`<ha-card class=${points.some((p) => p.niveau === 3) ? "grave" : ""}><ul>${montres.map((p) => html`<li class="n${p.niveau}"><button @click=${() => this.ouvrir(p)}>
      <span class="ico"><ha-icon icon=${p.icone}></ha-icon></span>
      <span class="nom">${p.titre}<small>${p.detail}</small></span>
      <ha-icon class="fleche" icon="mdi:chevron-right"></ha-icon></button></li>`)}</ul>
      ${reste > 0 ? html`<span class="plus">${majuscule(tx.autres(reste))}</span>` : nothing}</ha-card>`;
  }

  private ouvrir(p: Point): void {
    if (p.entite) plusDInfos(this, p.entite);
    else if (p.chemin) naviguer(p.chemin);
  }
}
