// Le ciel du jour, en tête de l'accueil : l'arc du soleil entre son lever et son coucher,
// le soleil à sa place de l'instant ; la nuit, la lune et sa phase. Dessiné d'après
// sun.sun (Home Assistant le met à jour toutes les quelques minutes).

import { css, html, nothing, svg, type TemplateResult } from "lit";
import type { HomeAssistant } from "../ha";
import { heure, langue, phaseLune } from "../outils";

const CYCLE = 29.530588853;

/** Le style du ciel, partagé par l'en-tête de l'accueil et la tablette murale. */
export const STYLE_CIEL = css`
  .ciel{margin:0;flex:none;display:flex;flex-direction:column;align-items:center;gap:2px}
  .ciel svg{display:block;overflow:visible}
  .ciel .rond{width:216px;height:96px}
  .ciel .bandeau{display:none;width:100%;height:auto}
  .ciel figcaption{font-size:12px;font-weight:550;color:var(--secondary-text-color);font-variant-numeric:tabular-nums;white-space:nowrap}
  .horizon{stroke:var(--divider-color);stroke-width:1.5}
  .arc{fill:none;stroke:var(--divider-color);stroke-width:2;stroke-dasharray:3 5;stroke-linecap:round}
  .parcouru{fill:none;stroke-width:2.5;stroke-linecap:round}
  .soleil{fill:#F6C453;stroke:#fff;stroke-width:1.5}
  .lune-ombre{fill:var(--automatic-dashboard-fond-alt, var(--secondary-background-color));stroke:var(--divider-color)}
  .lune{fill:#E8E4D8}
`;
/** Âge de la lune, de 0 (nouvelle) à 1 (nouvelle suivante) ; 0,5 est la pleine lune. */
export const ageLune = (date: Date): number =>
  (((((date.getTime() - Date.UTC(2000, 0, 6, 18, 14)) / 86400000) % CYCLE) + CYCLE) % CYCLE) / CYCLE;

/** Le lever et le coucher d'aujourd'hui (sun.sun ne donne que les prochains), et où en est la journée. */
export function journee(etat: { attributes: Record<string, any> } | undefined, maintenant: Date) {
  const lever = new Date(etat?.attributes.next_rising ?? "");
  const coucher = new Date(etat?.attributes.next_setting ?? "");
  if (Number.isNaN(lever.getTime()) || Number.isNaN(coucher.getTime())) return null;
  // Le prochain lever (ou coucher) est demain : celui d'aujourd'hui était 24 heures plus tôt, à quelques minutes près.
  const aujourdhui = (d: Date) => (d.toDateString() === maintenant.toDateString() ? d : new Date(d.getTime() - 86400000));
  const l = aujourdhui(lever);
  const c = aujourdhui(coucher);
  return { lever: l, coucher: c, avancement: (maintenant.getTime() - l.getTime()) / (c.getTime() - l.getTime()) };
}

/** Le chemin éclairé d'une lune de rayon r, centrée en (x, y), à un âge donné. */
export function luneEclairee(x: number, y: number, r: number, age: number): string {
  const k = Math.cos(2 * Math.PI * age);
  const rx = Math.abs(k) * r;
  const croissante = age < 0.5;
  // Le bord éclairé (droite si croissante), puis le terminateur qui revient en haut.
  const bord = `M${x} ${y - r}A${r} ${r} 0 0 ${croissante ? 1 : 0} ${x} ${y + r}`;
  const terminateur = `A${rx} ${r} 0 0 ${croissante ? (k > 0 ? 0 : 1) : k > 0 ? 1 : 0} ${x} ${y - r}Z`;
  return bord + terminateur;
}

/** Un dessin du ciel : rond (à côté du texte) ou en bandeau (sous le texte, sur téléphone). */
function dessin(L: number, H: number, base: number, rx: number, ry: number, j: NonNullable<ReturnType<typeof journee>>, maintenant: Date, classe: string) {
  const cx = L / 2;
  const jour = j.avancement >= 0 && j.avancement <= 1;
  const a = Math.min(1, Math.max(0, j.avancement));
  const sx = cx - rx * Math.cos(Math.PI * a);
  const sy = base - ry * Math.sin(Math.PI * a);
  const arc = `M${cx - rx} ${base}A${rx} ${ry} 0 0 1 ${cx + rx} ${base}`;
  const parcouru = `M${cx - rx} ${base}A${rx} ${ry} 0 0 1 ${sx.toFixed(1)} ${sy.toFixed(1)}`;
  const rLune = Math.min(15, ry * 0.45);
  const yLune = base - ry * 0.72;
  return svg`<svg class=${classe} viewBox="0 0 ${L} ${H}" aria-hidden="true">
      <line x1="6" x2=${L - 6} y1=${base} y2=${base} class="horizon"/>
      <path d=${arc} class="arc"/>
      ${jour
        ? svg`<path d=${parcouru} stroke="url(#arc-jour)" class="parcouru"/>
            <circle cx=${sx} cy=${sy} r="18" fill="url(#halo)"/><circle cx=${sx} cy=${sy} r="7" class="soleil"/>`
        : svg`<circle cx=${cx} cy=${yLune} r=${rLune} class="lune-ombre"/><path d=${luneEclairee(cx, yLune, rLune, ageLune(maintenant))} class="lune"/>`}
    </svg>`;
}

export function ciel(hass: HomeAssistant, maintenant = new Date()): TemplateResult | typeof nothing {
  const j = journee(hass.states["sun.sun"], maintenant);
  if (!j) return nothing;
  const fr = langue(hass) === "fr";
  const jour = j.avancement >= 0 && j.avancement <= 1;
  const lune = phaseLune(maintenant, langue(hass));
  const legende = jour
    ? `${fr ? "Lever" : "Sunrise"} ${heure(hass, j.lever)} · ${fr ? "coucher" : "sunset"} ${heure(hass, j.coucher)}`
    : lune.nom;
  return html`<figure class="ciel" aria-label=${legende}>
    <svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
      <linearGradient id="arc-jour" x1="0" x2="1"><stop offset="0" stop-color="#E9A23B" stop-opacity=".25"/><stop offset="1" stop-color="#E9A23B"/></linearGradient>
      <radialGradient id="halo"><stop offset="0" stop-color="#F6C453" stop-opacity=".55"/><stop offset="1" stop-color="#F6C453" stop-opacity="0"/></radialGradient>
    </defs></svg>
    ${dessin(216, 96, 74, 92, 56, j, maintenant, "rond")}
    ${dessin(360, 54, 46, 168, 34, j, maintenant, "bandeau")}
    <figcaption>${legende}</figcaption>
  </figure>`;
}
