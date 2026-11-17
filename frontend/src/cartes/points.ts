// Les points à regarder : une liste à filets, sans titre de section ; elle disparaît
// quand tout va bien. Le bouton « ⋯ » d'un point déplie ses actions, en toutes lettres :
// l'ignorer tant que rien ne change (sauf s'il est grave), être prévenu la prochaine fois.

import { css, html, nothing, type PropertyDeclarations, type TemplateResult } from "lit";
import type { HomeAssistant } from "../ha";
import { ignorer } from "../donnees/ignores";
import { automatisme, automatismeExiste, creerAutomatisme, idAutomatisme } from "../moteur/automatismes";
import { ignorable, type Point, pointsVisibles, signature } from "../moteur/points";
import type { Maison } from "../moteur/types";
import { majuscule, naviguer, plusDInfos, t } from "../outils";
import { CarteAutomatic, definis, type OptionsGrille } from "./base";
import { STYLE_COMMUN } from "./styles";

export class AutomaticPoints extends CarteAutomatic {
  static override properties: PropertyDeclarations = { _ouvert: { state: true } };
  /** Le point dont les actions sont dépliées. */
  private declare _ouvert: string | null;

  constructor() {
    super();
    this._ouvert = null;
  }

  static override styles = [STYLE_COMMUN, css`
    ha-card{padding:6px 16px}
    ha-card.grave{background:var(--automatic-dashboard-alerte-pale, color-mix(in srgb, var(--error-color, #B42318) 12%, transparent));border-color:transparent}
    ul{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr;column-gap:28px;align-items:start}
    @container (min-width: 640px){ ul{grid-template-columns:1fr 1fr} }
    li{border-top:1px solid var(--divider-color)}
    li:first-child{border-top:0}
    @container (min-width: 640px){ li:nth-child(2){border-top:0} }
    .ligne{display:grid;grid-template-columns:1fr auto;align-items:center;gap:4px}
    .ouvrir{display:grid;grid-template-columns:auto 1fr;align-items:center;gap:13px;width:100%;min-height:58px;padding:9px 0;text-align:left}
    .plus-actions{display:grid;place-items:center;width:38px;height:38px;border-radius:50%;color:var(--secondary-text-color)}
    .plus-actions:hover,.plus-actions:focus-visible,.plus-actions[aria-expanded="true"]{background:var(--secondary-background-color);color:var(--primary-text-color)}
    .plus-actions ha-icon{--mdc-icon-size:20px}
    .menu{display:flex;flex-wrap:wrap;gap:8px;padding:0 0 12px 53px}
    .menu button{display:inline-flex;align-items:center;gap:7px;min-height:36px;padding:0 14px 0 11px;border-radius:18px;font-size:13.5px;font-weight:600;
      background:var(--secondary-background-color);color:var(--primary-text-color)}
    .menu button:hover{background:color-mix(in srgb, var(--primary-color) 12%, var(--secondary-background-color))}
    .menu button.fait{color:var(--success-color, #2e7d32)}
    .menu ha-icon{--mdc-icon-size:18px}
    .menu .note{font-size:12.5px;line-height:1.4;color:var(--secondary-text-color);flex-basis:100%}
    .ignores{display:flex;align-items:center;flex-wrap:wrap;gap:8px;padding:9px 0 11px;font-size:13px;color:var(--secondary-text-color);border-top:1px solid var(--divider-color)}
    ul:empty + .ignores{border-top:0}
    .ignores ha-icon{--mdc-icon-size:17px}
    .ignores button{font-weight:650;color:var(--primary-color)}
    .n3 .ico{background:var(--automatic-dashboard-alerte-pale, color-mix(in srgb, var(--error-color, #B42318) 12%, transparent));color:var(--automatic-dashboard-alerte, var(--error-color, #B42318))}
    .n2 .ico{background:rgba(233,162,59,.16);color:var(--warning-color)}
    .n1 .ico{background:var(--automatic-dashboard-accent-pale, color-mix(in srgb, var(--primary-color) 12%, transparent));color:var(--primary-color)}
    .nom{font-weight:650;font-size:14.5px;line-height:1.25;color:var(--primary-text-color)}
    .nom small{display:block;font-weight:500;font-size:13px;color:var(--secondary-text-color);margin-top:2px}
    .plus{display:block;padding:8px 0 10px;font-size:13px;color:var(--secondary-text-color)}
    @container (max-width: 420px){ .menu{padding-left:0} }
  `];

  getGridOptions(): OptionsGrille {
    return { columns: "full", rows: "auto" };
  }

  override suivies(m: Maison): string[] {
    return definis([m.vigilance, ...m.personnes, ...[...m.alertes, ...m.ouvrants, ...m.piles, ...m.majs, ...m.systeme, ...m.securite, ...m.lumieres]
      .map((e) => e.id), ...m.pieces.flatMap((p) => [...p.temperatures, ...p.humidites])]);
  }

  protected override rendu(hass: HomeAssistant, m: Maison): TemplateResult | null {
    const tx = t(hass);
    const { visibles: points, ignores } = pointsVisibles(hass, m);
    if (!points.length && !ignores.length) return null;
    const plafond = m.mode === "decouverte" ? 3 : 4;
    const montres = points.slice(0, plafond);
    const reste = points.length - montres.length;
    return html`<ha-card class=${points.some((p) => p.niveau === 3) ? "grave" : ""}><ul>${montres.map((p) => {
      const actions = this.actions(hass, m, p);
      const ouvert = this._ouvert === p.cle;
      return html`<li class="n${p.niveau}">
        <div class="ligne">
          <button class="ouvrir" @click=${() => this.ouvrir(p)}>
            <span class="ico"><ha-icon icon=${p.icone}></ha-icon></span>
            <span class="nom">${p.titre}<small>${p.detail}</small></span></button>
          ${actions.length
            ? html`<button class="plus-actions" aria-expanded=${ouvert ? "true" : "false"} title=${tx.actions} aria-label=${`${tx.actions} ${p.titre}`}
                @click=${() => (this._ouvert = ouvert ? null : p.cle)}><ha-icon icon="mdi:dots-horizontal"></ha-icon></button>`
            : nothing}
        </div>
        ${ouvert ? html`<div class="menu">${actions}</div>` : nothing}</li>`;
    })}</ul>
      ${reste > 0 ? html`<span class="plus">${majuscule(tx.autres(reste))}</span>` : nothing}
      ${ignores.length
        ? html`<div class="ignores"><ha-icon icon="mdi:eye-off-outline"></ha-icon><span>${tx.ignores(ignores.length)}</span>
            <button @click=${() => ignorer(hass, ignores.map((p) => ({ cle: p.cle, signature: signature(hass, p) })), false)}>${tx.remontrer}</button></div>`
        : nothing}</ha-card>`;
  }

  /** Les actions d'un point, en toutes lettres : ignorer, être prévenu. */
  private actions(hass: HomeAssistant, m: Maison, p: Point): TemplateResult[] {
    const tx = t(hass);
    const actions: TemplateResult[] = [];
    if (ignorable(p)) {
      actions.push(html`<button @click=${() => { this._ouvert = null; ignorer(hass, [{ cle: p.cle, signature: signature(hass, p) }], true); }}>
        <ha-icon icon="mdi:eye-off-outline"></ha-icon>${tx.ignorer}</button>`);
    }
    if (p.prevenir) {
      if (automatismeExiste(hass, p.prevenir)) {
        actions.push(html`<button class="fait" @click=${() => naviguer(`/config/automation/edit/${idAutomatisme(p.prevenir!)}`)}>
          <ha-icon icon="mdi:bell-check-outline"></ha-icon>${tx.prevenu}</button>`);
      } else if (hass.user?.is_admin) {
        const a = automatisme(hass, m, p.prevenir);
        if (a) actions.push(html`<button @click=${() => this.creer(a)}><ha-icon icon="mdi:bell-plus-outline"></ha-icon>${tx.prevenir}</button>`);
      } else {
        actions.push(html`<span class="note">${tx.prevenirAdmin}</span>`);
      }
    }
    return actions;
  }

  private async creer(a: NonNullable<ReturnType<typeof automatisme>>): Promise<void> {
    const tx = t(this.hass);
    const annoncer = (message: string, action?: { text: string; action: () => void }) =>
      this.dispatchEvent(new CustomEvent("hass-notification", { detail: { message, action }, bubbles: true, composed: true }));
    try {
      await creerAutomatisme(this.hass!, a);
      this._ouvert = null;
      annoncer(tx.automatismeCree(String(a.config.alias)), { text: tx.voir, action: () => naviguer(`/config/automation/edit/${a.id}`) });
    } catch (erreur) {
      annoncer(`${tx.automatismeEchec} ${(erreur as Error)?.message ?? ""}`.trim());
    }
  }

  private ouvrir(p: Point): void {
    if (p.entite) plusDInfos(this, p.entite);
    else if (p.chemin) naviguer(p.chemin);
  }
}
