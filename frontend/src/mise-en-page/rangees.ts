// Des rangées toujours pleines, sur ordinateur (24 cases) comme sur téléphone (12).

export type Largeur = number | "full";

/**
 * Largeur de chacune des `n` cartes d'un groupe.
 * - base 6 : par paires ; un nombre impair donne une carte de 12, en tête (« promotion »)
 *   ou à la fin (« fin ») ;
 * - base 4 : par trois ; un reste d'une carte donne 12, de deux cartes 6 et 6.
 * L'ordinateur montre deux rangées de téléphone côte à côte : avec un nombre impair de
 * rangées, la dernière est élargie pour ne pas laisser de trou.
 */
export function rangees(n: number, base: 4 | 6 = 6, mode: "promotion" | "fin" = "promotion"): Largeur[] {
  const lignes: Largeur[][] = [];
  if (base === 6) {
    const impair = n % 2 === 1;
    if (impair && mode === "promotion") lignes.push([12]);
    for (let k = 0; k < Math.floor(n / 2); k++) lignes.push([6, 6]);
    if (impair && mode !== "promotion") lignes.push([12]);
  } else {
    const reste = n % 3;
    if (reste === 1) lignes.push([12]);
    if (reste === 2) lignes.push([6, 6]);
    for (let k = 0; k < Math.floor(n / 3); k++) lignes.push([4, 4, 4]);
  }
  if (lignes.length % 2 === 1) {
    const derniere = lignes[lignes.length - 1];
    lignes[lignes.length - 1] = derniere.length === 1 ? ["full"] : derniere.length === 2 ? [12, 12] : [12, 6, 6];
  }
  return lignes.flat();
}

/** Ajoute à chaque carte sa largeur (et sa hauteur) dans `grid_options`. */
export function avecLargeurs<T extends { grid_options?: Record<string, unknown> }>(
  cartes: T[], base: 4 | 6, mode: "promotion" | "fin", rows?: number,
): T[] {
  const largeurs = rangees(cartes.length, base, mode);
  return cartes.map((c, i) => ({ ...c, grid_options: { ...(c.grid_options ?? {}), columns: largeurs[i], ...(rows ? { rows } : {}) } }));
}

/** Cases occupées sur une grille de `colonnes` cases, pour vérifier qu'aucune rangée n'a de trou. */
export function remplissage(largeurs: Largeur[], colonnes: 12 | 24): number[] {
  const lignes: number[] = [];
  let courante = 0;
  for (const l of largeurs) {
    const cases = l === "full" ? colonnes : Math.min(l, colonnes);
    if (courante + cases > colonnes) { lignes.push(courante); courante = 0; }
    courante += cases;
    if (courante === colonnes) { lignes.push(courante); courante = 0; }
  }
  if (courante) lignes.push(courante);
  return lignes;
}
