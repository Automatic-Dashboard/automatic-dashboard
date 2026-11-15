// Les points à regarder : ce qui demande une action, du plus grave au moins grave.

import type { HomeAssistant } from "../ha";
import { nombre, nomCourt, t } from "../outils";
import type { Maison } from "./types";

export interface Point {
  /** 3 grave (fuite, fumée, alarme), 2 attention (ouverture, sauvegarde ratée), 1 information. */
  niveau: 1 | 2 | 3;
  icone: string;
  titre: string;
  detail: string;
  entite?: string;
  chemin?: string;
}

export function pointsARegarder(hass: HomeAssistant, m: Maison): Point[] {
  const tx = t(hass);
  const etat = (id: string) => hass.states[id];
  const points: Point[] = [];

  for (const e of m.alertes) {
    if (etat(e.id)?.state !== "on") continue;
    const fuite = e.classe === "moisture";
    points.push({ niveau: 3, icone: fuite ? "mdi:water-alert" : "mdi:smoke-detector-alert", titre: fuite ? tx.fuite : tx.fumee,
      detail: nomCourt(hass, e.id), entite: e.id });
  }
  for (const e of m.gardees.filter((x) => x.domaine === "alarm_control_panel")) {
    if (etat(e.id)?.state === "triggered") points.push({ niveau: 3, icone: "mdi:shield-alert", titre: tx.alarme, detail: nomCourt(hass, e.id), entite: e.id });
  }
  const vig = m.vigilance ? etat(m.vigilance) : undefined;
  if (vig && ["Orange", "Rouge"].includes(vig.state)) {
    const phenomenes = Object.entries(vig.attributes).filter(([, c]) => ["Jaune", "Orange", "Rouge"].includes(String(c))).map(([p]) => p).join(", ");
    points.push({ niveau: vig.state === "Rouge" ? 3 : 2, icone: "mdi:alert-outline", titre: tx.vigilance(vig.state.toLowerCase()), detail: phenomenes, entite: m.vigilance! });
  }
  for (const e of m.ouvrants) {
    if (etat(e.id)?.state === "on") points.push({ niveau: 2, icone: "mdi:window-open-variant", titre: nomCourt(hass, e.id), detail: tx.ouverte, entite: e.id });
  }
  for (const e of m.piles) {
    const v = Number.parseFloat(etat(e.id)?.state ?? "");
    if (!Number.isNaN(v) && v <= 20) {
      points.push({ niveau: v <= 10 ? 2 : 1, icone: "mdi:battery-alert-variant-outline", titre: tx.pileFaible,
        detail: `${nomCourt(hass, e.id)}, ${nombre(hass, v, 0)} %`, entite: e.id });
    }
  }
  const majs = m.majs.filter((e) => etat(e.id)?.state === "on");
  if (majs.length) points.push({ niveau: 1, icone: "mdi:package-up", titre: tx.majs(majs.length), detail: tx.majsDetail, chemin: "/config/updates" });

  const sauvegarde = (cle: string) => m.systeme.find((e) => e.plateforme === "backup" && hass.entities[e.id]?.translation_key === cle);
  const reussie = sauvegarde("last_successful_automatic_backup");
  const tentee = sauvegarde("last_attempted_automatic_backup");
  if (reussie) {
    const dReussie = new Date(etat(reussie.id)?.state ?? "");
    const dTentee = new Date((tentee && etat(tentee.id)?.state) ?? "");
    if (!Number.isNaN(dTentee.getTime()) && (Number.isNaN(dReussie.getTime()) || dTentee > dReussie)) {
      points.push({ niveau: 2, icone: "mdi:backup-restore", titre: tx.sauvegardeEchec, detail: tx.sauvegardeEchecDetail, chemin: "/config/backup" });
    } else if (Number.isNaN(dReussie.getTime())) {
      points.push({ niveau: 1, icone: "mdi:backup-restore", titre: tx.sauvegardeAucune, detail: tx.sauvegardeAucuneDetail, chemin: "/config/backup" });
    }
  }
  return points.sort((a, b) => b.niveau - a.niveau);
}
