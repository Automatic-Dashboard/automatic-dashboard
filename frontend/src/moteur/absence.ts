// Le mode absence : quand tout le monde est parti, l'accueil met la sécurité en tête.
// Seules la phrase et les points changent, jamais la disposition : le salon reste au même
// endroit, on y lit seulement autre chose.

import type { HomeAssistant } from "../ha";
import { estFrancais, nomCourt, t } from "../outils";
import { avecArticle } from "./conseils";
import type { Point } from "./points";
import type { Maison } from "./types";

/** Tout le monde est parti : au moins une personne suivie, et aucune à la maison. */
export function estAbsent(hass: HomeAssistant, m: Maison): boolean {
  const suivies = m.personnes.map((id) => hass.states[id])
    .filter((s) => s && Array.isArray(s.attributes.device_trackers) && s.attributes.device_trackers.length > 0);
  return suivies.length > 0 && suivies.every((s) => s.state !== "home" && s.state !== "unknown" && s.state !== "unavailable");
}

/** Ce qui reste ouvert, allumé ou déverrouillé : de quoi écrire la phrase. */
export function bilanAbsence(hass: HomeAssistant, m: Maison) {
  const etat = (id: string) => hass.states[id]?.state;
  return {
    ouverts: m.ouvrants.filter((e) => etat(e.id) === "on"),
    lumieres: m.lumieres.filter((e) => etat(e.id) === "on"),
    serrures: m.securite.filter((e) => e.domaine === "lock" && ["unlocked", "open", "opening"].includes(etat(e.id) ?? "")),
    alarmes: m.securite.filter((e) => e.domaine === "alarm_control_panel" && etat(e.id) === "disarmed"),
  };
}

/** Les points propres à l'absence : lumières oubliées, serrures ouvertes, alarme désarmée. */
export function pointsAbsence(hass: HomeAssistant, m: Maison): Point[] {
  const tx = t(hass);
  const fr = estFrancais(hass);
  const b = bilanAbsence(hass, m);
  const points: Point[] = [];
  for (const e of b.serrures) {
    const nom = nomCourt(hass, e.id, m.noms);
    const article = avecArticle(nom, fr);
    points.push({ cle: `serrure:${e.id}`, niveau: 2, icone: "mdi:lock-open-variant-outline", conseil: true, securite: true,
      titre: article ? tx.verrouiller(article) : `${tx.verrouillerSans} : ${nom}`, detail: tx.personneLa, entite: e.id });
  }
  for (const e of b.alarmes) {
    points.push({ cle: `alarme-desarmee:${e.id}`, niveau: 2, icone: "mdi:shield-off-outline", conseil: true, securite: true,
      titre: tx.armer, detail: tx.personneLa, entite: e.id });
  }
  if (b.lumieres.length) {
    const pieces = [...new Set(b.lumieres.map((e) => m.pieces.find((p) => p.area_id === e.piece)?.name).filter(Boolean))];
    points.push({ cle: "lumieres-absence", niveau: 1, icone: "mdi:lightbulb-group-off-outline", conseil: true, securite: true,
      titre: tx.eteindre, detail: tx.lumieresOubliees(b.lumieres.length, pieces.slice(0, 3).join(", ")), entite: b.lumieres[0].id });
  }
  return points;
}
