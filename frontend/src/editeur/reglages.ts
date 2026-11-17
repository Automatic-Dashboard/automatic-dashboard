// Les opérations de l'éditeur sur la configuration du tableau, en fonctions pures :
// chacune rend une nouvelle configuration, sans clé vide (le YAML reste lisible).

import type { ConfigStrategie } from "../strategie/strategie";

/** Retire les réglages vides ou égaux au défaut. */
export function nettoyer(config: ConfigStrategie): ConfigStrategie {
  const propre: ConfigStrategie = { ...config };
  if (!propre.mode || propre.mode === "auto") delete propre.mode;
  for (const cle of ["favoris", "masquer"] as const) {
    const liste = [...new Set(propre[cle] ?? [])].filter(Boolean);
    if (liste.length) propre[cle] = liste;
    else delete propre[cle];
  }
  if (propre.completer !== false) delete propre.completer;
  const noms = Object.fromEntries(Object.entries(propre.noms ?? {}).filter(([, nom]) => typeof nom === "string" && nom.trim()));
  if (Object.keys(noms).length) propre.noms = noms;
  else delete propre.noms;
  return propre;
}

/** Déplace un élément d'une liste (glisser-déposer). */
export function deplacer<T>(liste: T[], de: number, vers: number): T[] {
  const copie = [...liste];
  const [element] = copie.splice(de, 1);
  if (element === undefined) return liste;
  copie.splice(Math.max(0, Math.min(vers, copie.length)), 0, element);
  return copie;
}

/** Épingle en favori : à la fin des épinglés ; une entité épinglée n'est plus masquée. */
export const epingler = (c: ConfigStrategie, id: string): ConfigStrategie =>
  nettoyer({ ...c, favoris: [...(c.favoris ?? []).filter((x) => x !== id), id], masquer: (c.masquer ?? []).filter((x) => x !== id) });

export const desepingler = (c: ConfigStrategie, id: string): ConfigStrategie =>
  nettoyer({ ...c, favoris: (c.favoris ?? []).filter((x) => x !== id) });

/** Masque partout : l'entité sort aussi des favoris épinglés. */
export const masquer = (c: ConfigStrategie, id: string): ConfigStrategie =>
  nettoyer({ ...c, masquer: [...(c.masquer ?? []), id], favoris: (c.favoris ?? []).filter((x) => x !== id) });

export const demasquer = (c: ConfigStrategie, id: string): ConfigStrategie =>
  nettoyer({ ...c, masquer: (c.masquer ?? []).filter((x) => x !== id) });

/** Renomme ; un nom vide rend celui de Home Assistant. */
export function renommer(c: ConfigStrategie, id: string, nom: string): ConfigStrategie {
  const noms = { ...(c.noms ?? {}) };
  if (nom.trim()) noms[id] = nom;
  else delete noms[id];
  return nettoyer({ ...c, noms });
}
