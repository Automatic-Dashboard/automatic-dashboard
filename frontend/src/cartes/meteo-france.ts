// Météo-France : la pluie dans l'heure (une phrase et une barre de tranches, plus ou
// moins foncées selon l'intensité) et la vigilance du département (une ligne discrète
// au vert, un bloc à la couleur du niveau sinon). D'après docs/conception/02-mode-decouverte.md,
// parties 5.3 et 5.4. Se masque sans Météo-France ou sans donnée.

import { css, html, nothing, type TemplateResult } from "lit";
import type { HomeAssistant } from "../ha";
import { lirePluie, lireVigilance, nomPhenomene, type Pluie } from "../moteur/meteo-france";
import type { Maison } from "../moteur/types";
import { estFrancais, heure, plusDInfos, t } from "../outils";
import { CarteAutomatic, definis, type OptionsGrille } from "./base";
import { STYLE_COMMUN } from "./styles";

const CARTE_OFFICIELLE = "https://vigilance.meteofrance.fr";

export class AutomaticMeteoFrance extends CarteAutomatic {
  static override styles = [STYLE_COMMUN, css`
    ha-card{display:flex;flex-direction:column;gap:12px;padding:14px 16px}
    button.pluie{display:block;width:100%;border-radius:12px}
    .tete{display:flex;align-items:baseline;justify-content:space-between;gap:12px}
    .source{font-size:12px;white-space:nowrap}
    .phrase{display:flex;align-items:center;gap:8px;margin-top:6px;font-size:15px;font-weight:650;color:var(--primary-text-color)}
    .phrase ha-icon{--mdc-icon-size:20px;color:var(--primary-color)}
    .barre{display:flex;gap:3px;height:12px;margin-top:10px}
    .barre i{display:block;min-width:4px;border-radius:4px;background:color-mix(in srgb, var(--secondary-text-color) 20%, transparent)}
    .barre i.i1{background:color-mix(in srgb, var(--primary-color) 38%, transparent)}
    .barre i.i2{background:color-mix(in srgb, var(--primary-color) 68%, transparent)}
    .barre i.i3{background:var(--primary-color)}
    .axe{display:flex;justify-content:space-between;margin-top:5px;font-size:11.5px;color:var(--secondary-text-color)}
    button.vert{display:flex;align-items:center;gap:9px;font-size:13.5px;color:var(--secondary-text-color);border-radius:8px}
    .pastille{width:9px;height:9px;border-radius:50%;background:var(--automatic-dashboard-vert, var(--success-color, #1E6B47));flex:none}
    .vigilance{display:grid;grid-template-columns:auto 1fr;gap:12px;padding:13px 14px;border-radius:14px}
    .vigilance .ico{width:38px;height:38px}
    .n1{background:rgba(232,194,26,.16)} .n1 .ico{background:#E8C21A;color:#3A3000}
    .n2{background:rgba(233,140,40,.16)} .n2 .ico{background:#E98C28;color:#fff}
    .n3{background:var(--automatic-dashboard-alerte-pale, color-mix(in srgb, var(--error-color, #B42318) 12%, transparent))} .n3 .ico{background:var(--automatic-dashboard-alerte, var(--error-color, #B42318));color:#fff}
    .titre{font-size:15px;font-weight:700;color:var(--primary-text-color)}
    .phenomenes{font-size:13.5px;font-weight:600;color:var(--primary-text-color);margin-top:2px}
    .conseil{margin:6px 0 0;font-size:13px;line-height:1.4;color:var(--secondary-text-color)}
    a{display:inline-flex;align-items:center;gap:4px;margin-top:8px;font-size:13px;font-weight:650;color:var(--primary-color);text-decoration:none}
    a ha-icon{--mdc-icon-size:15px}
  `];

  getGridOptions(): OptionsGrille {
    return { columns: 12, rows: "auto" };
  }

  override suivies(m: Maison): string[] {
    return definis([m.meteoFrance, m.vigilance]);
  }

  protected override rendu(hass: HomeAssistant, m: Maison): TemplateResult | null {
    const tx = t(hass);
    const pluie = lirePluie(m.meteoFrance ? hass.states[m.meteoFrance] : undefined);
    const vig = lireVigilance(m.vigilance ? hass.states[m.vigilance] : undefined);
    if (!pluie && !vig) return null;
    const fr = estFrancais(hass);
    const alerte = vig && vig.niveau > 0
      ? html`<div class="vigilance n${vig.niveau}" role="alert"><span class="ico"><ha-icon icon="mdi:alert-outline"></ha-icon></span><div>
          <div class="titre">${tx.vigilance(tx.couleurs[vig.niveau])}</div>
          <div class="phenomenes">${vig.phenomenes.map((p) => nomPhenomene(p.nom, fr)).join(", ")}</div>
          <p class="conseil">${tx.conseils[vig.niveau]}</p>
          <a href=${CARTE_OFFICIELLE} target="_blank" rel="noopener noreferrer">${tx.vigilanceCarte}<ha-icon icon="mdi:open-in-new"></ha-icon></a></div></div>`
      : nothing;
    const vert = vig && vig.niveau === 0
      ? html`<button class="vert" @click=${() => plusDInfos(this, m.vigilance!)}><span class="pastille"></span>${tx.vigilanceVerte}</button>`
      : nothing;
    return html`<ha-card>${alerte}${pluie ? this.pluie(hass, pluie, m.meteoFrance!) : nothing}${vert}</ha-card>`;
  }

  private pluie(hass: HomeAssistant, p: Pluie, id: string): TemplateResult {
    const tx = t(hass);
    const type = (texte: string | null) => (texte ? tx.pluieTypes[texte] ?? texte : "");
    const phrase = p.dans === null ? tx.pluieAucune
      : p.continue ? tx.pluieContinue
        : p.fin !== null ? tx.pluieFin(p.fin)
          : tx.pluieDans(type(p.type), p.dans);
    return html`<button class="pluie" @click=${() => plusDInfos(this, id)}>
      <span class="tete"><span class="sur">${tx.pluieTitre}</span>${p.reference ? html`<span class="source doux">${tx.pluieSource(heure(hass, p.reference))}</span>` : nothing}</span>
      <span class="phrase"><ha-icon icon=${p.dans === null ? "mdi:umbrella-closed-outline" : "mdi:umbrella-outline"}></ha-icon>${phrase}</span>
      <span class="barre" aria-hidden="true">${p.tranches.map((tr) => html`<i class="i${tr.intensite}" style="flex:${tr.duree} 1 0"
        title=${`${tr.debut} min · ${type(tr.texte)}`}></i>`)}</span>
      <span class="axe"><span>${tx.maintenant}</span><span>${tx.dans1h}</span></span></button>`;
  }
}
