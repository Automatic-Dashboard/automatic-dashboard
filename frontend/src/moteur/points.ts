// Les points à regarder : ce qui demande une action, du plus grave au moins grave.

import { estIgnore } from "../donnees/ignores";
import type { HomeAssistant } from "../ha";
import type { Sujet } from "./automatismes";
import { estFrancais, nombre, nomCourt, t } from "../outils";
import { aUnBilan } from "../donnees/bilan";
import { estAbsent, pointsAbsence } from "./absence";
import { conseils } from "./conseils";
import { lireVigilance, nomPhenomene } from "./meteo-france";
import type { Maison } from "./types";

export interface Point {
  /** Identifie le point d'un jour à l'autre (pour l'ignorer) : « ouvrant:binary_sensor.fenetre ». */
  cle: string;
  /** 3 grave (fuite, fumée, alarme), 2 attention (ouverture, sauvegarde ratée), 1 information. */
  niveau: 1 | 2 | 3;
  icone: string;
  titre: string;
  detail: string;
  entite?: string;
  chemin?: string;
  /** Un conseil (ce qu'on peut faire), plutôt qu'un constat. */
  conseil?: boolean;
  /** « Me prévenir » : l'automatisme tout fait qui préviendra la prochaine fois. */
  prevenir?: Sujet;
  /** Un point de sécurité : en tête quand personne n'est à la maison. */
  securite?: boolean;
}

export function pointsARegarder(hass: HomeAssistant, m: Maison): Point[] {
  const tx = t(hass);
  const etat = (id: string) => hass.states[id];
  const points: Point[] = [];

  for (const e of m.alertes) {
    if (etat(e.id)?.state !== "on") continue;
    const fuite = e.classe === "moisture";
    points.push({ cle: `alerte:${e.id}`, niveau: 3, icone: fuite ? "mdi:water-alert" : "mdi:smoke-detector-alert", titre: fuite ? tx.fuite : tx.fumee,
      detail: nomCourt(hass, e.id, m.noms), entite: e.id, prevenir: fuite ? "fuite" : ["smoke", "gas", "carbon_monoxide"].includes(e.classe ?? "") ? "fumee" : undefined });
  }
  for (const e of m.gardees.filter((x) => x.domaine === "alarm_control_panel")) {
    if (etat(e.id)?.state === "triggered") points.push({ cle: `alarme:${e.id}`, niveau: 3, icone: "mdi:shield-alert", titre: tx.alarme, detail: nomCourt(hass, e.id, m.noms), entite: e.id });
  }
  // Vigilance orange ou rouge seulement : la jaune, fréquente et sans action à faire, reste dans le bloc Météo-France.
  const vig = lireVigilance(m.vigilance ? etat(m.vigilance) : undefined);
  if (vig && vig.niveau >= 2) {
    const phenomenes = vig.phenomenes.map((p) => nomPhenomene(p.nom, estFrancais(hass))).join(", ");
    points.push({ cle: "vigilance", niveau: vig.niveau === 3 ? 3 : 2, icone: "mdi:alert-outline", titre: tx.vigilance(tx.couleurs[vig.niveau]), detail: phenomenes, entite: m.vigilance! });
  }
  // Les conseils d'abord : ils remplacent le simple constat d'une fenêtre ouverte.
  const avis = conseils(hass, m);
  points.push(...avis.points);
  for (const e of m.ouvrants) {
    if (avis.remplaces.has(e.id)) continue;
    if (etat(e.id)?.state === "on") points.push({ cle: `ouvrant:${e.id}`, securite: true, niveau: 2, icone: "mdi:window-open-variant", titre: nomCourt(hass, e.id, m.noms), detail: tx.ouverte, entite: e.id });
  }
  for (const e of m.piles) {
    const v = Number.parseFloat(etat(e.id)?.state ?? "");
    if (!Number.isNaN(v) && v <= 20) {
      points.push({ cle: `pile:${e.id}`, niveau: v <= 10 ? 2 : 1, icone: "mdi:battery-alert-variant-outline", titre: tx.pileFaible,
        detail: `${nomCourt(hass, e.id, m.noms)}, ${nombre(hass, v, 0)} %`, entite: e.id, prevenir: "pile" });
    }
  }
  // Uptime Kuma : un service surveillé qui ne répond plus (capteur d'état « down »).
  for (const e of m.systeme.filter((x) => x.plateforme === "uptime_kuma" && x.domaine === "sensor")) {
    if (etat(e.id)?.state === "down") {
      points.push({ cle: `service:${e.id}`, niveau: 2, icone: "mdi:server-off", titre: tx.serviceEnPanne, detail: nomCourt(hass, e.id, m.noms), entite: e.id });
    }
  }
  const majs = m.majs.filter((e) => etat(e.id)?.state === "on");
  if (majs.length) points.push({ cle: "majs", niveau: 1, icone: "mdi:package-up", titre: tx.majs(majs.length), detail: tx.majsDetail, chemin: "/config/updates" });

  const sauvegarde = (cle: string) => m.systeme.find((e) => e.plateforme === "backup" && hass.entities[e.id]?.translation_key === cle);
  const reussie = sauvegarde("last_successful_automatic_backup");
  const tentee = sauvegarde("last_attempted_automatic_backup");
  if (reussie) {
    const dReussie = new Date(etat(reussie.id)?.state ?? "");
    const dTentee = new Date((tentee && etat(tentee.id)?.state) ?? "");
    if (!Number.isNaN(dTentee.getTime()) && (Number.isNaN(dReussie.getTime()) || dTentee > dReussie)) {
      points.push({ cle: "sauvegarde", niveau: 2, icone: "mdi:backup-restore", titre: tx.sauvegardeEchec, detail: tx.sauvegardeEchecDetail,
        chemin: "/config/backup", prevenir: "sauvegarde" });
    } else if (Number.isNaN(dReussie.getTime())) {
      points.push({ cle: "sauvegarde", niveau: 1, icone: "mdi:backup-restore", titre: tx.sauvegardeAucune, detail: tx.sauvegardeAucuneDetail, chemin: "/config/backup" });
    }
  }
  // Le lundi, le bilan de la semaine passée attend dans sa page.
  if (new Date().getDay() === 1 && aUnBilan(hass, m)) {
    points.push({ cle: "bilan", niveau: 1, icone: "mdi:calendar-week", titre: tx.bilanPret, detail: tx.bilanPretDetail, chemin: "bilan" });
  }

  // Personne à la maison : ce qui est resté ouvert, allumé ou déverrouillé passe en tête,
  // juste après ce qui est grave. Les autres points suivent, dans leur ordre.
  if (estAbsent(hass, m)) {
    points.push(...pointsAbsence(hass, m));
    const rang = (p: Point) => (p.niveau === 3 ? 0 : p.securite ? 1 : 2);
    return points.sort((a, b) => rang(a) - rang(b) || b.niveau - a.niveau);
  }
  return points.sort((a, b) => b.niveau - a.niveau);
}

/** Un point grave ne s'ignore jamais. */
export const ignorable = (p: Point): boolean => p.niveau < 3;

/** Les points à regarder, sans ceux que l'utilisateur a ignorés aujourd'hui. */
export function pointsVisibles(hass: HomeAssistant, m: Maison): { visibles: Point[]; ignores: Point[] } {
  const tous = pointsARegarder(hass, m);
  const ignores = tous.filter((p) => ignorable(p) && estIgnore(p.cle));
  return { visibles: tous.filter((p) => !ignores.includes(p)), ignores };
}
