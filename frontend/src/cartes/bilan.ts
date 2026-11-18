// Le bilan de la semaine, dans une seule carte composée : l'énergie jour par jour à gauche,
// les températures en plages à droite, et ce qui s'est ouvert en bas. Chaque partie se tait
// quand la maison n'a pas de quoi la remplir.

import { poserStyle } from "./style";
import { css, html, nothing, type PropertyDeclarations, type TemplateResult } from "lit";
import { type Bilan, chargerBilan, type Periode, type Plage } from "../donnees/bilan";
import type { HomeAssistant } from "../ha";
import type { Maison } from "../moteur/types";
import { degres, langue, majuscule, nombre, nomCourt, plusDInfos, t } from "../outils";
import { CarteAutomatic, type OptionsGrille } from "./base";
import { STYLE_COMMUN } from "./styles";

export class AutomaticBilan extends CarteAutomatic {
  static override properties: PropertyDeclarations = { _bilan: { state: true }, _periode: { state: true } };
  private declare _bilan?: Bilan;
  /** Semaine ou mois : le choix est gardé sur cet appareil. */
  private declare _periode: Periode;
  private _demande?: Periode;

  constructor() {
    super();
    this._periode = (localStorage.getItem("automatic_dashboard_bilan") as Periode | null) === "mois" ? "mois" : "semaine";
  }

  private changerPeriode(p: Periode): void {
    this._periode = p;
    localStorage.setItem("automatic_dashboard_bilan", p);
  }

  static override styles = [STYLE_COMMUN, css`
    ha-card{padding:16px 20px 16px;display:grid;gap:18px 28px;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);
      grid-template-areas:"tete tete" "energie temperatures" "ouvertures ouvertures"}
    .tete{grid-area:tete;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
    .periode{font-size:15px;font-weight:650;color:var(--primary-text-color)}
    .segments{display:inline-flex;padding:3px;border-radius:12px;background:var(--secondary-background-color);gap:2px}
    .segments button{padding:6px 13px;border-radius:9px;font-size:13px;font-weight:600;color:var(--secondary-text-color)}
    .segments button.choisi{background:var(--card-background-color, #fff);color:var(--primary-text-color);box-shadow:0 1px 3px rgba(0,0,0,.12)}
    .cout{font-size:20px;font-weight:650;color:var(--secondary-text-color)}
    .energie{grid-area:energie}
    .temperatures{grid-area:temperatures;display:grid;gap:16px;align-content:start}
    .ouvertures{grid-area:ouvertures;padding-top:16px;border-top:1px solid var(--divider-color)}
    .grand{display:flex;align-items:baseline;flex-wrap:wrap;gap:6px 10px;margin-top:6px}
    .valeur{font-size:32px;font-weight:680;letter-spacing:-.025em;line-height:1;color:var(--primary-text-color)}
    .valeur small{font-size:15px;font-weight:600;color:var(--secondary-text-color);margin-left:3px;letter-spacing:0}
    .ecart{font-size:12.5px;font-weight:650;padding:3px 9px;border-radius:11px;background:var(--automatic-dashboard-fond-alt, var(--secondary-background-color))}
    .ecart.baisse{background:color-mix(in srgb, var(--success-color, #2e7d32) 14%, transparent);color:var(--success-color, #2e7d32)}
    .ecart.hausse{background:rgba(233,162,59,.16);color:var(--warning-color)}
    .barres{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:clamp(2px,1vw,8px);align-items:end;height:92px;margin-top:16px}
    .barre{display:flex;flex-direction:column;align-items:center;gap:6px;height:100%;justify-content:flex-end}
    .barre span{display:block;width:100%;max-width:34px;border-radius:7px 7px 3px 3px;min-height:3px;
      background:color-mix(in srgb, var(--primary-color) 32%, transparent)}
    .barre.haut span{background:var(--primary-color)}
    .barre small{font-size:11.5px;font-weight:600;color:var(--secondary-text-color);text-transform:uppercase}
    .ligne{display:grid;grid-template-columns:auto 1fr;gap:2px 12px;align-items:center}
    .ligne .nom{font-size:13px;font-weight:600;color:var(--secondary-text-color)}
    .ligne .moy{grid-row:span 2;font-size:26px;font-weight:680;letter-spacing:-.02em;color:var(--primary-text-color);min-width:76px}
    .plage{position:relative;height:8px;border-radius:4px;background:var(--automatic-dashboard-fond-alt, var(--secondary-background-color))}
    .plage span{position:absolute;top:0;bottom:0;border-radius:4px;background:linear-gradient(90deg, #4FA3D9, #E9A23B)}
    .bornes{display:flex;justify-content:space-between;font-size:12px;color:var(--secondary-text-color)}
    .ouvertures .grand{margin:4px 0 10px}
    .ouvertures .valeur{font-size:24px}
    .liste{display:flex;flex-wrap:wrap;gap:8px}
    .liste button{display:inline-flex;align-items:center;gap:8px;height:34px;padding:0 12px;border-radius:17px;font-size:13.5px;
      background:var(--automatic-dashboard-fond-alt, var(--secondary-background-color));color:var(--primary-text-color)}
    .liste b{font-variant-numeric:tabular-nums;color:var(--primary-color)}
    .vide{font-size:13.5px;color:var(--secondary-text-color);margin-top:8px}
    .partiel{margin:10px 0 0;font-size:13px;line-height:1.4;color:var(--secondary-text-color)}
    .barre.sans span{background:transparent;border:1px dashed var(--divider-color);min-height:14px;box-sizing:border-box}
    .attente.e{height:150px}
    .attente.t{height:120px}
    @container (max-width: 560px){
      ha-card{grid-template-columns:1fr;grid-template-areas:"tete" "energie" "temperatures" "ouvertures"}
    }
  `];

  getGridOptions(): OptionsGrille {
    return { columns: "full", rows: "auto" };
  }

  protected override rendu(hass: HomeAssistant, m: Maison): TemplateResult | null {
    if (this._demande !== this._periode) {
      this._demande = this._periode;
      const periode = this._periode;
      chargerBilan(hass, m, new Date(), periode).then((b) => { if (b.periode === this._periode) this._bilan = b; });
    }
    const b = this._bilan?.periode === this._periode ? this._bilan : undefined;
    const tete = this.tete(hass, b);
    if (!b) return html`<ha-card>${tete}<span class="attente e"></span><span class="attente t"></span></ha-card>`;
    if (!b.energie && !b.dedans && !b.ouvertures?.total) {
      return html`<ha-card>${tete}<p class="vide" ${poserStyle({ "grid-column": "1/-1" })}>${t(hass).bilanVide}</p></ha-card>`;
    }
    return html`<ha-card>${tete}${this.energie(hass, b)}${this.temperatures(hass, b)}${this.ouvertures(hass, m, b)}</ha-card>`;
  }

  /** La période montrée, et le choix entre la semaine et le mois. */
  private tete(hass: HomeAssistant, b?: Bilan): TemplateResult {
    const tx = t(hass);
    const lg = langue(hass);
    let titre = "";
    if (b) {
      const dernier = new Date(b.fin.getTime() - 12 * 3600000);
      titre = b.periode === "mois"
        ? majuscule(new Intl.DateTimeFormat(lg, { month: "long", year: "numeric" }).format(b.debut))
        : tx.bilanPhrase(new Intl.DateTimeFormat(lg, { weekday: "long", day: "numeric" }).format(b.debut),
          new Intl.DateTimeFormat(lg, { weekday: "long", day: "numeric", month: "long" }).format(dernier));
    }
    return html`<div class="tete"><span class="periode">${titre}</span>
      <div class="segments" role="radiogroup" aria-label=${tx.bilan}>
        ${(["semaine", "mois"] as Periode[]).map((p) => html`<button role="radio" aria-checked=${this._periode === p ? "true" : "false"}
          class=${this._periode === p ? "choisi" : ""} @click=${() => this.changerPeriode(p)}>${p === "mois" ? tx.mois : tx.semaine}</button>`)}
      </div></div>`;
  }

  private energie(hass: HomeAssistant, b: Bilan): TemplateResult {
    const tx = t(hass);
    if (!b.energie) return html`<div class="energie"><div class="sur">${tx.energie}</div><p class="vide">${tx.bilanSansEnergie}</p></div>`;
    const { jours, total, precedent, cout } = b.energie;
    const plus = Math.max(...jours.map((v) => v ?? 0), 0.001);
    const jour = new Intl.DateTimeFormat(langue(hass), { weekday: "narrow" });
    const ecart = precedent ? Math.round(((total - precedent) / precedent) * 100) : null;
    const monnaie = (hass.config as { currency?: string }).currency || "EUR";
    const euros = cout === null ? null : new Intl.NumberFormat(langue(hass), { style: "currency", currency: monnaie }).format(cout);
    // Un mois : le numéro du jour, une fois par semaine ; une semaine : l'initiale du jour.
    const etiquette = (date: Date, i: number) => (b.periode === "mois" ? (i % 7 === 0 ? String(date.getDate()) : "") : jour.format(date));
    return html`<div class="energie">
      <div class="sur">${tx.energie}</div>
      <div class="grand"><span class="valeur chiffre">${nombre(hass, total, total < 100 ? 1 : 0)}<small>kWh</small></span>
        ${euros ? html`<span class="cout chiffre">${euros}</span>` : nothing}
        ${ecart !== null && ecart !== 0
          ? html`<span class=${`ecart ${ecart < 0 ? "baisse" : "hausse"}`}>${tx.bilanEcart(`${ecart > 0 ? "+" : "−"}${Math.abs(ecart)} %`)}</span>`
          : nothing}</div>
      ${jours.some((v) => v === null)
        ? html`<p class="partiel">${b.periode === "mois" ? tx.bilanPartielMois(jours.filter((v) => v !== null).length)
          : tx.bilanPartiel(jours.filter((v) => v !== null).length)}</p>` : nothing}
      <div class="barres" role="img" aria-label=${tx.bilanBarres}>
        ${jours.map((v, i) => {
          const date = new Date(b.debut.getFullYear(), b.debut.getMonth(), b.debut.getDate() + i, 12);
          return html`<div class=${`barre${v === null ? " sans" : v === plus ? " haut" : ""}`} title=${v === null ? tx.bilanSansDonnee : `${nombre(hass, v, 1)} kWh`}>
            <span ${poserStyle({ height: `${v === null ? 0 : Math.max(3, (v / plus) * 100)}%` })}></span><small>${etiquette(date, i)}</small></div>`;
        })}
      </div></div>`;
  }

  private temperatures(hass: HomeAssistant, b: Bilan): TemplateResult {
    const tx = t(hass);
    const plages = [[majuscule(tx.dedans), b.dedans], [tx.dehors, b.dehors]].filter((x): x is [string, Plage] => Boolean(x[1]));
    if (!plages.length) return html`<div class="temperatures"><div class="sur">${tx.temperatures}</div><p class="vide">${tx.bilanSansTemperature}</p></div>`;
    // Une seule échelle pour dedans et dehors : on compare les deux d'un coup d'œil.
    const bas = Math.min(...plages.map(([, p]) => p.min)) - 1;
    const haut = Math.max(...plages.map(([, p]) => p.max)) + 1;
    const pos = (v: number) => ((v - bas) / (haut - bas)) * 100;
    return html`<div class="temperatures"><div class="sur">${tx.temperatures}</div>
      ${plages.map(([nom, p]) => html`<div class="ligne">
        <span class="moy chiffre">${degres(hass, p.moyenne)}</span><span class="nom">${nom} · ${tx.moyenne}</span>
        <div><div class="plage"><span ${poserStyle({ left: `${pos(p.min)}%`, right: `${100 - pos(p.max)}%` })}></span></div>
          <div class="bornes chiffre"><span>${degres(hass, p.min)}</span><span>${degres(hass, p.max)}</span></div></div>
      </div>`)}</div>`;
  }

  private ouvertures(hass: HomeAssistant, m: Maison, b: Bilan): TemplateResult | typeof nothing {
    const tx = t(hass);
    if (!b.ouvertures || !m.ouvrants.length) return nothing;
    const { total, parEntite } = b.ouvertures;
    return html`<div class="ouvertures"><div class="sur">${tx.ouvertures}</div>
      <div class="grand"><span class="valeur chiffre">${total}<small>${tx.bilanFois(total)}</small></span></div>
      ${parEntite.length
        ? html`<div class="liste">${parEntite.slice(0, 4).map(([id, n]) => html`<button @click=${() => plusDInfos(this, id)}>
            ${nomCourt(hass, id, m.noms)}<b>${n}</b></button>`)}</div>`
        : html`<p class="vide">${t(hass).rienOuvert}</p>`}</div>`;
  }
}
