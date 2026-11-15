// Les mini-courbes, dessinées en SVG avec Lit. L'élément <svg> est écrit dans un
// gabarit `html` (c'est un élément HTML), ses tracés dans des gabarits `svg`.

import { html, nothing, svg, type TemplateResult } from "lit";
import type { Serie } from "../donnees/historique";

/** Une courbe d'une série, à superposer aux autres. */
export interface SerieCourbe {
  valeurs: Serie;
  couleur: string;
}

/** Moyenne de chaque point avec ses deux voisins : adoucit les marches de l'historique. */
export function lisser(valeurs: Serie): Serie {
  return valeurs.map((v, i) => {
    if (v === null) return null;
    const voisins = [valeurs[i - 1], v, valeurs[i + 1]].filter((x): x is number => x !== null && x !== undefined);
    return voisins.reduce((a, b) => a + b, 0) / voisins.length;
  });
}

const pointsConnus = (valeurs: Serie): [number, number][] =>
  valeurs.flatMap((v, i): [number, number][] => (v === null ? [] : [[i, v]]));

/** Une courbe seule, avec son aire, sur toute la largeur de la carte. */
export function courbe(valeurs: Serie, largeur = 120, hauteur = 34): TemplateResult | typeof nothing {
  const points = pointsConnus(valeurs);
  if (points.length < 2) return nothing;
  const vs = points.map(([, v]) => v);
  const min = Math.min(...vs), max = Math.max(...vs), ecart = max - min || 1;
  const x = (i: number) => (i / (valeurs.length - 1)) * largeur;
  const y = (v: number) => hauteur - 3 - ((v - min) / ecart) * (hauteur - 6);
  const ligne = points.map(([i, v], k) => `${k ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const aire = `${ligne} L${x(points[points.length - 1][0]).toFixed(1)} ${hauteur} L${x(points[0][0]).toFixed(1)} ${hauteur} Z`;
  return html`<svg class="courbe" viewBox="0 0 ${largeur} ${hauteur}" preserveAspectRatio="none" aria-hidden="true">${svg`
    <path d=${aire} fill="var(--primary-color)" fill-opacity=".10"/><path d=${ligne} fill="none" stroke="var(--primary-color)" stroke-width="1.6" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>`}</svg>`;
}

/** Plusieurs courbes sur la même échelle (dedans et dehors, par exemple) : la première pleine, les autres en pointillé. */
export function courbes(series: SerieCourbe[], largeur = 300, hauteur = 92): TemplateResult | typeof nothing {
  const lissees = series.map((s) => ({ ...s, valeurs: lisser(s.valeurs) }));
  const toutes = lissees.flatMap((s) => s.valeurs.filter((v): v is number => v !== null));
  if (toutes.length < 2) return nothing;
  const min = Math.min(...toutes), max = Math.max(...toutes), ecart = max - min || 1;
  const traces = lissees.map((s, n) => {
    const pts = pointsConnus(s.valeurs);
    if (pts.length < 2) return nothing;
    const x = (i: number) => (i / (s.valeurs.length - 1)) * largeur;
    const y = (v: number) => hauteur - 6 - ((v - min) / ecart) * (hauteur - 14);
    const ligne = pts.map(([i, v], k) => `${k ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
    const aire = n === 0
      ? svg`<path d=${`${ligne} L${x(pts[pts.length - 1][0])} ${hauteur} L${x(pts[0][0])} ${hauteur} Z`} fill=${s.couleur} fill-opacity=".10"/>`
      : nothing;
    return svg`${aire}<path d=${ligne} fill="none" stroke=${s.couleur} stroke-width=${n === 0 ? 2 : 1.6} stroke-dasharray=${n ? "4 4" : nothing} vector-effect="non-scaling-stroke" stroke-linejoin="round"/>`;
  });
  return html`<svg class="graphe" viewBox="0 0 ${largeur} ${hauteur}" preserveAspectRatio="none" aria-hidden="true">${traces}</svg>`;
}
