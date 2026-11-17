// « Je pars » : avant de sortir, tout ce qui reste ouvert, allumé ou déverrouillé, avec un
// bouton par geste (tout éteindre, tout verrouiller, fermer les volets, armer l'alarme). Les
// fenêtres se ferment à la main : elles sont listées. Quand tout est prêt, la carte le dit.

import { css, html, nothing, type PropertyDeclarations, type TemplateResult } from "lit";
import type { HomeAssistant } from "../ha";
import type { Entite, Maison } from "../moteur/types";
import { nomCourt, plusDInfos, t } from "../outils";
import { CarteAutomatic, type OptionsGrille } from "./base";
import { STYLE_COMMUN } from "./styles";

/** Ce qui reste à faire avant de partir. */
export function avantDePartir(hass: HomeAssistant, m: Maison) {
  const etat = (e: Entite) => hass.states[e.id]?.state;
  return {
    ouvertures: m.ouvrants.filter((e) => etat(e) === "on"),
    lumieres: m.lumieres.filter((e) => etat(e) === "on"),
    serrures: m.gardees.filter((e) => e.domaine === "lock" && ["unlocked", "open"].includes(etat(e) ?? "")),
    // Les volets seulement : une porte de garage ou un portail ne se ferme pas sans regarder.
    volets: m.gardees.filter((e) => e.domaine === "cover" && etat(e) === "open" && !["garage", "gate", "door"].includes(e.classe ?? "")),
    alarmes: m.gardees.filter((e) => e.domaine === "alarm_control_panel" && etat(e) === "disarmed"),
  };
}

export class AutomaticDepart extends CarteAutomatic {
  static override properties: PropertyDeclarations = { _enCours: { state: true }, _message: { state: true } };
  private declare _enCours: string | null;
  private declare _message: string;

  constructor() {
    super();
    this._enCours = null;
    this._message = "";
  }

  static override styles = [STYLE_COMMUN, css`
    ha-card{padding:8px 20px 16px}
    .groupe{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:14px;padding:14px 0;border-top:1px solid var(--divider-color)}
    .groupe:first-child{border-top:0}
    .titre{font-size:15px;font-weight:650;color:var(--primary-text-color)}
    .liste{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
    .liste button{font-size:13px;padding:4px 10px;border-radius:12px;background:var(--secondary-background-color);color:var(--primary-text-color)}
    .agir{display:inline-flex;align-items:center;gap:6px;height:38px;padding:0 16px 0 12px;border-radius:19px;font-size:14px;font-weight:650;
      background:var(--primary-color);color:var(--text-primary-color, #fff)}
    .agir:disabled{opacity:.5;cursor:default}
    .agir ha-icon{--mdc-icon-size:18px}
    .main{font-size:13px;color:var(--secondary-text-color)}
    .pret{display:flex;align-items:center;gap:14px;padding:18px 0 10px;font-size:17px;font-weight:600;color:var(--primary-text-color)}
    .pret ha-icon{--mdc-icon-size:32px;color:var(--automatic-dashboard-vert, var(--success-color, #1E6B47))}
    .message{margin:8px 0 0;font-size:13px;color:var(--secondary-text-color)}
    @container (max-width: 480px){ .groupe{grid-template-columns:auto 1fr} .groupe > .agir,.groupe > .main{grid-column:2;justify-self:start} }
  `];

  getGridOptions(): OptionsGrille {
    return { columns: "full", rows: "auto" };
  }

  override suivies(m: Maison): string[] {
    return [...m.ouvrants, ...m.lumieres, ...m.gardees.filter((e) => ["lock", "cover", "alarm_control_panel"].includes(e.domaine))].map((e) => e.id);
  }

  protected override rendu(hass: HomeAssistant, m: Maison): TemplateResult {
    const tx = t(hass);
    const a = avantDePartir(hass, m);
    const groupes: TemplateResult[] = [];
    const liste = (entites: Entite[]) => html`<div class="liste">${entites.map((e) => html`<button @click=${() => plusDInfos(this, e.id)}>
      ${nomCourt(hass, e.id, m.noms)}</button>`)}</div>`;
    const groupe = (icone: string, titre: string, entites: Entite[], action: TemplateResult) => html`<div class="groupe">
      <span class="ico actif"><ha-icon icon=${icone}></ha-icon></span><div><div class="titre">${titre}</div>${liste(entites)}</div>${action}</div>`;
    const bouton = (cle: string, libelle: string, icone: string, faire: () => Promise<unknown>) => html`<button class="agir"
      ?disabled=${this._enCours !== null} @click=${() => this.agir(cle, faire)}><ha-icon icon=${icone}></ha-icon>${libelle}</button>`;
    const appeler = (domaine: string, service: string, ids: string[]) => () => hass.callService!(domaine, service, { entity_id: ids });

    if (a.lumieres.length) {
      groupes.push(groupe("mdi:lightbulb-group-outline", tx.departLumieres(a.lumieres.length), a.lumieres,
        bouton("lumieres", tx.toutEteindre, "mdi:lightbulb-off-outline", appeler("light", "turn_off", a.lumieres.map((e) => e.id)))));
    }
    if (a.serrures.length) {
      groupes.push(groupe("mdi:lock-open-variant-outline", tx.departSerrures(a.serrures.length), a.serrures,
        bouton("serrures", tx.toutVerrouiller, "mdi:lock-outline", appeler("lock", "lock", a.serrures.map((e) => e.id)))));
    }
    if (a.volets.length) {
      groupes.push(groupe("mdi:window-shutter-open", tx.departVolets(a.volets.length), a.volets,
        bouton("volets", tx.toutFermer, "mdi:window-shutter", appeler("cover", "close_cover", a.volets.map((e) => e.id)))));
    }
    for (const alarme of a.alarmes) {
      // Une alarme qui demande un code s'arme dans sa propre fenêtre.
      const code = Boolean(hass.states[alarme.id]?.attributes.code_arm_required);
      groupes.push(groupe("mdi:shield-off-outline", tx.departAlarme, [alarme], code
        ? html`<button class="agir" @click=${() => plusDInfos(this, alarme.id)}><ha-icon icon="mdi:shield-lock-outline"></ha-icon>${tx.armer}</button>`
        : bouton("alarme", tx.armer, "mdi:shield-lock-outline", appeler("alarm_control_panel", "alarm_arm_away", [alarme.id]))));
    }
    if (a.ouvertures.length) {
      groupes.push(groupe("mdi:window-open-variant", tx.departOuvertures(a.ouvertures.length), a.ouvertures, html`<span class="main">${tx.aLaMain}</span>`));
    }
    return html`<ha-card>
      ${groupes.length ? groupes : html`<div class="pret"><ha-icon icon="mdi:check-circle-outline"></ha-icon>${tx.departPret}</div>`}
      ${this._message ? html`<p class="message" role="status">${this._message}</p>` : nothing}
    </ha-card>`;
  }

  private async agir(cle: string, faire: () => Promise<unknown>): Promise<void> {
    this._enCours = cle;
    this._message = "";
    try {
      await faire();
    } catch (erreur) {
      this._message = `${t(this.hass).departEchec} ${(erreur as Error)?.message ?? ""}`.trim();
    } finally {
      this._enCours = null;
    }
  }
}
