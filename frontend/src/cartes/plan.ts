// Les pièces en mosaïque : chaque pièce est un bloc coloré par sa température, étage par
// étage (le plus haut en haut). Les rangées sont toujours pleines : les blocs s'étirent, les
// grandes pièces un peu plus. Du bleu au sable puis à l'orange, lisible par les daltoniens,
// et le chiffre est toujours écrit. Un clic ouvre la pièce.

import { css, html, nothing, type TemplateResult } from "lit";
import type { HomeAssistant } from "../ha";
import type { Maison, Piece } from "../moteur/types";
import { depuisCelsius, premiereTemperatureC, premiereValeur } from "../moteur/valeurs";
import { degres, estFrancais, naviguer, nombre } from "../outils";
import { CarteAutomatic, type OptionsGrille } from "./base";
import { STYLE_COMMUN } from "./styles";

/** Du froid au chaud : les paliers de couleur d'une pièce. */
/** Les couleurs par température, seuils en °C (une maison en °F est convertie). */
export const PALIERS: [number, string][] = [[17, "#3E6FB0"], [19, "#7BA7D1"], [22, "#CDBB8F"], [24, "#E9A23B"], [Infinity, "#C8613A"]];
export const couleurTemperature = (t: number | null): string | null => (t === null ? null : PALIERS.find(([seuil]) => t < seuil)![1]);

export class AutomaticPlan extends CarteAutomatic {
  static override styles = [STYLE_COMMUN, css`
    ha-card{padding:16px 16px 14px;display:grid;gap:12px}
    .etage{display:grid;grid-template-columns:auto 1fr;gap:10px;align-items:stretch}
    .etage > .sur{writing-mode:vertical-rl;transform:rotate(180deg);text-align:center;font-size:10.5px;padding:4px 0}
    .sans-etage{grid-template-columns:1fr}
    .pieces{display:flex;flex-wrap:wrap;gap:6px}
    .piece{display:flex;flex-direction:column;justify-content:space-between;min-width:86px;height:84px;padding:10px 12px;border-radius:12px;
      box-sizing:border-box;text-align:left;background:color-mix(in srgb, var(--c, #888) 30%, var(--card-background-color, #fff));
      border:1px solid color-mix(in srgb, var(--c, #888) 50%, transparent);transition:transform .12s}
    .piece:hover{transform:translateY(-1px)}
    .piece.inconnue{--c:var(--secondary-text-color);background:transparent;border-style:dashed}
    .piece.dehors{background:repeating-linear-gradient(135deg, color-mix(in srgb, var(--c, #888) 18%, transparent) 0 6px, transparent 6px 12px);border-style:dashed}
    .nom{font-size:13px;font-weight:650;color:var(--primary-text-color);line-height:1.2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .bas{display:flex;align-items:baseline;justify-content:space-between;gap:6px}
    .temp{font-size:22px;font-weight:700;letter-spacing:-.02em;color:var(--primary-text-color)}
    .hum{font-size:12px;font-weight:600;color:var(--secondary-text-color)}
    .legende{display:flex;align-items:center;gap:10px;font-size:11.5px;color:var(--secondary-text-color);font-variant-numeric:tabular-nums}
    .legende span.degrade{flex:1;max-width:220px;height:6px;border-radius:3px;
      background:linear-gradient(90deg, #3E6FB0, #7BA7D1 25%, #CDBB8F 50%, #E9A23B 75%, #C8613A)}
    @media (prefers-reduced-motion: reduce){ .piece{transition:none} }
  `];

  getGridOptions(): OptionsGrille {
    return { columns: "full", rows: "auto" };
  }

  override suivies(m: Maison): string[] {
    return m.pieces.flatMap((p) => [...p.temperatures, ...p.humidites]);
  }

  protected override rendu(hass: HomeAssistant, m: Maison): TemplateResult | null {
    const pieces = m.pieces.filter((p) => p.entites.length || p.temperatures.length);
    if (pieces.filter((p) => p.temperatures.length).length < 2) return null;
    // La légende est graduée dans l'unité des capteurs affichés.
    const capteur = pieces.find((p) => p.temperatures.length)!.temperatures[0];
    // Le plus haut étage en haut ; les pièces sans étage à la fin.
    const etages = [...m.etages].sort((a, b) => (b.level ?? 0) - (a.level ?? 0));
    const groupes: [string | null, Piece[]][] = etages.map((e): [string | null, Piece[]] => [e.name, pieces.filter((p) => p.etage === e.floor_id)])
      .filter(([, l]) => l.length);
    const sans = pieces.filter((p) => !p.etage);
    if (sans.length) groupes.push([groupes.length ? (estFrancais(hass) ? "Autres" : "Other") : null, sans]);
    return html`<ha-card>
      ${groupes.map(([nom, liste]) => html`<div class=${nom ? "etage" : "etage sans-etage"}>
        ${nom ? html`<span class="sur">${nom}</span>` : nothing}
        <div class="pieces">${liste.map((p) => this.piece(hass, p))}</div></div>`)}
      <div class="legende"><span>${Math.round(depuisCelsius(hass, 16, capteur))}°</span><span class="degrade"></span><span>${Math.round(depuisCelsius(hass, 26, capteur))}°</span></div>
    </ha-card>`;
  }

  private piece(hass: HomeAssistant, p: Piece): TemplateResult {
    const t = premiereValeur(hass, p.temperatures);
    const h = premiereValeur(hass, p.humidites);
    const couleur = couleurTemperature(premiereTemperatureC(hass, p.temperatures));
    // Une pièce pèse selon ses appareils : le salon est plus grand que les toilettes.
    const poids = 1 + Math.min(1, p.utiles / 8);
    const classes = ["piece", couleur ? "" : "inconnue", p.exterieur ? "dehors" : ""].join(" ");
    return html`<button class=${classes} style=${`flex:${poids} 1 ${Math.round(86 * poids)}px;${couleur ? `--c:${couleur}` : ""}`}
      title=${p.name} @click=${() => p.entites.length && naviguer(p.area_id)}>
      <span class="nom">${p.name}</span>
      <span class="bas"><span class="temp chiffre">${t === null ? "—" : degres(hass, t)}</span>
        ${h === null ? nothing : html`<span class="hum chiffre">${nombre(hass, h, 0)} %</span>`}</span>
    </button>`;
  }
}
