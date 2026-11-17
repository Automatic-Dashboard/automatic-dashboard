// Le mode tablette murale : une page à part (/<tableau>/tablette), lisible de loin. L'heure
// en grand, la date, la phrase d'état, le ciel du jour et trois chiffres ; à droite, les
// points à regarder. La nuit, sans toucher l'écran pendant une minute, un écran de veille
// noir garde l'heure, faible, et la déplace un peu chaque minute (pas de marque sur l'écran).

import { css, html, nothing, type PropertyDeclarations, type TemplateResult } from "lit";
import type { HomeAssistant } from "../ha";
import { pointsVisibles } from "../moteur/points";
import type { Maison } from "../moteur/types";
import { moyenneInterieure, temperatureDehors } from "../moteur/valeurs";
import { phraseAccueil } from "../phrases";
import { conditionMeteo, degres, langue, majuscule, nombre, plusDInfos, t } from "../outils";
import { CarteAutomatic, definis, type OptionsGrille } from "./base";
import { ciel, STYLE_CIEL } from "./ciel";
import { STYLE_COMMUN } from "./styles";

/** La nuit de l'écran de veille : de 23 h à 6 h. */
export const estNuit = (d: Date): boolean => d.getHours() >= 23 || d.getHours() < 6;
const VEILLE_APRES = 60000;

export class AutomaticTablette extends CarteAutomatic {
  static override properties: PropertyDeclarations = { _veille: { state: true }, _minute: { state: true } };
  private declare _veille: boolean;
  private declare _minute: number;
  private _horloge?: number;
  private _dernierGeste = Date.now();

  constructor() {
    super();
    this._veille = false;
    this._minute = -1;
  }

  static override styles = [STYLE_COMMUN, STYLE_CIEL, css`
    :host{height:100%}
    .ecran{box-sizing:border-box;min-height:calc(100vh - var(--header-height, 56px) - 16px);display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr);
      gap:clamp(20px,4vw,64px);padding:clamp(20px,4vw,56px);align-items:center}
    .heure{font-size:clamp(84px,14vw,200px);font-weight:700;letter-spacing:-.05em;line-height:.9;color:var(--primary-text-color);font-variant-numeric:tabular-nums}
    .date{margin-top:14px;font-size:clamp(20px,2.4vw,30px);font-weight:600;color:var(--secondary-text-color)}
    .phrase{display:flex;align-items:baseline;gap:14px;margin-top:clamp(20px,3vw,40px);font-size:clamp(20px,2.3vw,30px);line-height:1.35;
      color:var(--primary-text-color);max-width:28ch}
    .phrase::before{content:"";flex:none;width:14px;height:14px;border-radius:50%;background:var(--point);transform:translateY(-2px)}
    .chiffres{display:flex;flex-wrap:wrap;gap:clamp(18px,3vw,44px);margin-top:clamp(24px,3vw,44px)}
    .chiffre-tab{display:flex;flex-direction:column;gap:4px}
    .chiffre-tab b{font-size:clamp(28px,3.4vw,46px);font-weight:680;letter-spacing:-.02em;color:var(--primary-text-color);font-variant-numeric:tabular-nums}
    .chiffre-tab span{font-size:15px;font-weight:600;color:var(--secondary-text-color);display:flex;align-items:center;gap:6px}
    .chiffre-tab ha-icon{--mdc-icon-size:18px}
    .droite{display:grid;gap:18px;align-content:center}
    .ciel{align-self:start}
    .ciel .rond{width:min(100%,320px);height:auto}
    .ciel figcaption{font-size:14px}
    ul{list-style:none;margin:0;padding:0;display:grid;gap:10px}
    li button{display:grid;grid-template-columns:auto 1fr;gap:16px;align-items:center;width:100%;padding:16px 18px;border-radius:18px;
      background:var(--ha-card-background, var(--card-background-color));border:1px solid var(--divider-color)}
    li .ico{width:48px;height:48px;border-radius:14px}
    li .ico ha-icon{--mdc-icon-size:26px}
    .n3 .ico{background:var(--automatic-dashboard-alerte-pale);color:var(--automatic-dashboard-alerte)}
    .n2 .ico{background:rgba(233,162,59,.16);color:var(--warning-color)}
    .n1 .ico{background:var(--automatic-dashboard-accent-pale);color:var(--primary-color)}
    .titre{font-size:19px;font-weight:650;color:var(--primary-text-color);line-height:1.25}
    .titre small{display:block;font-size:15px;font-weight:500;color:var(--secondary-text-color);margin-top:3px}
    .calme{font-size:20px;color:var(--secondary-text-color);display:flex;align-items:center;gap:12px}
    .calme ha-icon{--mdc-icon-size:30px;color:var(--automatic-dashboard-vert)}
    .veille{position:fixed;inset:0;z-index:100;background:#000;cursor:none;display:block}
    .veille .heure{position:absolute;color:#fff;opacity:.32;font-size:clamp(64px,10vw,140px);transition:left 2s, top 2s}
    @container (max-width: 760px){ .ecran{grid-template-columns:1fr;align-items:start} }
    @media (prefers-reduced-motion: reduce){ .veille .heure{transition:none} }
  `];

  getGridOptions(): OptionsGrille {
    return { columns: "full", rows: "auto" };
  }

  override suivies(m: Maison): string[] {
    return definis(["sun.sun", m.meteo, m.puissanceReseau, ...m.personnes, ...m.temperaturesInterieures.flat(), ...m.securite.map((e) => e.id),
      ...m.alertes.map((e) => e.id), ...m.piles.map((e) => e.id), ...m.majs.map((e) => e.id), ...m.lumieres.map((e) => e.id)]);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    // Une horloge à la seconde près ; l'écran de veille se décide en même temps.
    this._horloge = window.setInterval(() => {
      const maintenant = new Date();
      if (maintenant.getMinutes() !== this._minute) this._minute = maintenant.getMinutes();
      const veille = estNuit(maintenant) && Date.now() - this._dernierGeste > VEILLE_APRES;
      if (veille !== this._veille) this._veille = veille;
    }, 1000);
    for (const geste of ["pointerdown", "keydown", "touchstart"]) window.addEventListener(geste, this._reveil, { capture: true });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.clearInterval(this._horloge);
    for (const geste of ["pointerdown", "keydown", "touchstart"]) window.removeEventListener(geste, this._reveil, { capture: true });
  }

  // Un geste réveille l'écran ; celui qui réveille ne déclenche rien d'autre.
  private _reveil = (ev: Event): void => {
    this._dernierGeste = Date.now();
    if (this._veille) {
      ev.preventDefault();
      ev.stopPropagation();
      this._veille = false;
    }
  };

  protected override rendu(hass: HomeAssistant, m: Maison): TemplateResult {
    const tx = t(hass);
    const maintenant = new Date();
    const heure = new Intl.DateTimeFormat(langue(hass), { hour: "2-digit", minute: "2-digit" }).format(maintenant);
    if (this._veille) {
      // La position change chaque minute, toujours dans l'écran.
      const graine = maintenant.getHours() * 60 + maintenant.getMinutes();
      const x = 8 + ((graine * 37) % 50);
      const y = 10 + ((graine * 53) % 60);
      return html`<div class="veille" role="button" aria-label=${tx.reveiller}><span class="heure" style=${`left:${x}%;top:${y}%`}>${heure}</span></div>`;
    }
    const date = majuscule(new Intl.DateTimeFormat(langue(hass), { weekday: "long", day: "numeric", month: "long" }).format(maintenant));
    const { phrase, point } = phraseAccueil(hass, m);
    const dedans = moyenneInterieure(hass, m);
    const dehors = temperatureDehors(hass, m);
    const meteo = m.meteo ? hass.states[m.meteo] : undefined;
    const puissance = m.puissanceReseau ? Number.parseFloat(hass.states[m.puissanceReseau]?.state ?? "") : Number.NaN;
    const points = pointsVisibles(hass, m).visibles.slice(0, 4);
    return html`<div class="ecran">
      <div>
        <div class="heure">${heure}</div>
        <div class="date">${date}</div>
        <div class="phrase" style=${`--point:${point}`}>${phrase}</div>
        <div class="chiffres">
          ${dehors !== null ? html`<div class="chiffre-tab"><b>${degres(hass, dehors)}</b>
            <span><ha-icon icon=${conditionMeteo(hass, meteo).icone}></ha-icon>${tx.dehors}</span></div>` : nothing}
          ${dedans !== null ? html`<div class="chiffre-tab"><b>${degres(hass, dedans)}</b><span><ha-icon icon="mdi:home-thermometer-outline"></ha-icon>${majuscule(tx.dedans)}</span></div>` : nothing}
          ${!Number.isNaN(puissance) ? html`<div class="chiffre-tab"><b>${nombre(hass, puissance, 0)} W</b>
            <span><ha-icon icon="mdi:lightning-bolt-outline"></ha-icon>${tx.energie}</span></div>` : nothing}
        </div>
      </div>
      <div class="droite">
        ${ciel(hass, maintenant)}
        ${points.length
          ? html`<ul>${points.map((p) => html`<li class="n${p.niveau}"><button @click=${() => p.entite && plusDInfos(this, p.entite)}>
              <span class="ico"><ha-icon icon=${p.icone}></ha-icon></span><span class="titre">${p.titre}<small>${p.detail}</small></span></button></li>`)}</ul>`
          : html`<div class="calme"><ha-icon icon="mdi:check-circle-outline"></ha-icon>${tx.toutVaBien}</div>`}
      </div>
    </div>`;
  }
}
