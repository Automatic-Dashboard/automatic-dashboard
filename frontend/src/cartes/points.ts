// Les points à regarder : une liste à filets, sans titre de section ; elle disparaît
// quand tout va bien. Un point qui n'est pas grave s'ignore jusqu'à demain, d'un clic.

import { css, html, nothing, type TemplateResult } from "lit";
import type { HomeAssistant } from "../ha";
import { ignorer } from "../donnees/ignores";
import { automatisme, automatismeExiste, creerAutomatisme, idAutomatisme } from "../moteur/automatismes";
import { ignorable, type Point, pointsVisibles } from "../moteur/points";
import type { Maison } from "../moteur/types";
import { majuscule, naviguer, plusDInfos, t } from "../outils";
import { CarteAutomatic, definis, type OptionsGrille } from "./base";
import { STYLE_COMMUN } from "./styles";

export class AutomaticPoints extends CarteAutomatic {
  static override styles = [STYLE_COMMUN, css`
    ha-card{padding:6px 16px}
    ha-card.grave{background:var(--automatic-dashboard-alerte-pale);border-color:transparent}
    ul{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr;column-gap:28px}
    @container (min-width: 640px){ ul{grid-template-columns:1fr 1fr} }
    li{border-top:1px solid var(--divider-color)}
    li:first-child{border-top:0}
    @container (min-width: 640px){ li:nth-child(2){border-top:0} }
    li{display:grid;grid-template-columns:1fr auto;align-items:center;gap:4px}
    .actions{display:flex;align-items:center;gap:2px}
    .action.fait{color:var(--success-color, #2e7d32);opacity:1}
    li .ouvrir{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:13px;width:100%;min-height:58px;padding:9px 0;text-align:left}
    .action{display:grid;place-items:center;width:36px;height:36px;border-radius:50%;color:var(--secondary-text-color);opacity:.75}
    .action:hover,.action:focus-visible{opacity:1;background:var(--secondary-background-color);color:var(--primary-text-color)}
    .action ha-icon{--mdc-icon-size:19px}
    .ignores{display:flex;align-items:center;gap:8px;padding:9px 0 11px;font-size:13px;color:var(--secondary-text-color);border-top:1px solid var(--divider-color)}
    ul:empty + .ignores{border-top:0}
    .ignores ha-icon{--mdc-icon-size:17px}
    .ignores button{font-weight:650;color:var(--primary-color)}
    .n3 .ico{background:var(--automatic-dashboard-alerte-pale);color:var(--automatic-dashboard-alerte)}
    .n2 .ico{background:rgba(233,162,59,.16);color:var(--warning-color)}
    .n1 .ico{background:var(--automatic-dashboard-accent-pale);color:var(--primary-color)}
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
    const { visibles: points, ignores } = pointsVisibles(hass, m);
    if (!points.length && !ignores.length) return null;
    const plafond = m.mode === "complet" ? 4 : m.mode === "maison" ? 4 : 3;
    const montres = points.slice(0, plafond);
    const reste = points.length - montres.length;
    return html`<ha-card class=${points.some((p) => p.niveau === 3) ? "grave" : ""}><ul>${montres.map((p) => html`<li class="n${p.niveau}">
      <button class="ouvrir" @click=${() => this.ouvrir(p)}>
        <span class="ico"><ha-icon icon=${p.icone}></ha-icon></span>
        <span class="nom">${p.titre}<small>${p.detail}</small></span>
        ${ignorable(p) ? nothing : html`<ha-icon class="fleche" icon="mdi:chevron-right"></ha-icon>`}</button>
      <span class="actions">${this.prevenir(hass, m, p)}
      ${ignorable(p)
        ? html`<button class="action" title=${tx.ignorer} aria-label=${`${tx.ignorer} : ${p.titre}`} @click=${() => ignorer(hass, [p.cle], true)}>
            <ha-icon icon="mdi:eye-off-outline"></ha-icon></button>`
        : nothing}</span></li>`)}</ul>
      ${reste > 0 ? html`<span class="plus">${majuscule(tx.autres(reste))}</span>` : nothing}
      ${ignores.length
        ? html`<div class="ignores"><ha-icon icon="mdi:eye-off-outline"></ha-icon><span>${tx.ignores(ignores.length)}</span>
            <button @click=${() => ignorer(hass, ignores.map((p) => p.cle), false)}>${tx.remontrer}</button></div>`
        : nothing}</ha-card>`;
  }

  // « Me prévenir » : l'automatisme tout fait (administrateur seulement). Une fois créé, la
  // cloche cochée ouvre l'automatisme dans l'éditeur de Home Assistant.
  private prevenir(hass: HomeAssistant, m: Maison, p: Point): TemplateResult | typeof nothing {
    if (!p.prevenir || !hass.user?.is_admin) return nothing;
    const tx = t(hass);
    if (automatismeExiste(hass, p.prevenir)) {
      return html`<button class="action fait" title=${tx.prevenu} aria-label=${tx.prevenu}
        @click=${() => naviguer(`/config/automation/edit/${idAutomatisme(p.prevenir!)}`)}><ha-icon icon="mdi:bell-check-outline"></ha-icon></button>`;
    }
    const a = automatisme(hass, m, p.prevenir);
    if (!a) return nothing;
    return html`<button class="action" title=${tx.prevenir} aria-label=${`${tx.prevenir} : ${p.titre}`}
      @click=${() => this.creer(a)}><ha-icon icon="mdi:bell-plus-outline"></ha-icon></button>`;
  }

  private async creer(a: NonNullable<ReturnType<typeof automatisme>>): Promise<void> {
    const tx = t(this.hass);
    const annoncer = (message: string, action?: { text: string; action: () => void }) =>
      this.dispatchEvent(new CustomEvent("hass-notification", { detail: { message, action }, bubbles: true, composed: true }));
    try {
      await creerAutomatisme(this.hass!, a);
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
