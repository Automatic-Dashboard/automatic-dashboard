// Les phrases de tête des pages : une ligne qui résume la météo, une pièce ou un sujet,
// et la couleur du point qui la précède (vert : tout va bien, orange : à regarder…).

import type { HomeAssistant } from "./ha";
import { bilanAbsence, estAbsent } from "./moteur/absence";
import { conseils } from "./moteur/conseils";
import { pointsVisibles } from "./moteur/points";
import type { Maison, Piece } from "./moteur/types";
import { lirePluie } from "./moteur/meteo-france";
import { premiereTemperatureC, premiereValeur, temperatureDehors } from "./moteur/valeurs";
import { conditionMeteo, degres, ilYa, majuscule, nombre, nomCourt, t, valide } from "./outils";

export interface Phrase {
  phrase: string;
  /** Couleur CSS du point devant la phrase. */
  point: string;
}

const VERT = "var(--automatic-dashboard-vert, var(--success-color, #1E6B47))";
const ORANGE = "var(--warning-color)";
const ROUGE = "var(--automatic-dashboard-alerte, var(--error-color, #B42318))";
const BLEU = "var(--primary-color)";

/**
 * La phrase de l'accueil (et de la tablette murale) : une alerte grave d'abord, puis ce qui
 * reste quand personne n'est là, la météo en mode Découverte, les points, ou « tout va bien ».
 */
export function phraseAccueil(hass: HomeAssistant, m: Maison): Phrase {
  const tx = t(hass);
  const points = pointsVisibles(hass, m).visibles;
  const graves = points.filter((p) => p.niveau === 3);
  if (graves.length) return { phrase: tx.alerteGrave(`${graves[0].titre} : ${graves[0].detail}`), point: ROUGE };
  if (estAbsent(hass, m)) {
    // Personne à la maison : ce qui est resté ouvert, allumé ou déverrouillé.
    const b = bilanAbsence(hass, m);
    const reste = [
      b.ouverts.length ? tx.absOuverts(b.ouverts.length) : "", b.serrures.length ? tx.absSerrures(b.serrures.length) : "",
      b.lumieres.length ? tx.absLumieres(b.lumieres.length) : "", b.alarmes.length ? tx.absAlarme : "",
    ].filter(Boolean);
    return reste.length ? { phrase: tx.absenceReste(reste.join(", ")), point: ORANGE } : { phrase: tx.absenceCalme, point: VERT };
  }
  if (m.mode === "decouverte") return phraseMeteo(hass, m);
  if (points.length) return { phrase: tx.points(points.length), point: ORANGE };
  return { phrase: tx.toutVaBien, point: VERT };
}

/** « Éclaircies, 12,4°. Pas de pluie dans l'heure. » */
export function phraseMeteo(hass: HomeAssistant, m: Maison): Phrase {
  const tx = t(hass);
  const meteo = m.meteo ? hass.states[m.meteo] : undefined;
  if (!valide(meteo)) return { phrase: "", point: BLEU };
  const cond = conditionMeteo(hass, meteo).texte;
  let phrase = tx.phraseMeteo(cond, degres(hass, meteo.attributes.temperature));
  const pluie = lirePluie(m.meteoFrance ? hass.states[m.meteoFrance] : undefined);
  if (pluie) phrase += " " + (pluie.dans === null ? tx.pasDePluie : pluie.dans === 0 ? tx.pluieEnCours : tx.pluieDansPhrase(pluie.dans));
  return { phrase, point: BLEU };
}

/** « 21,3° · 48 %, 2 lumières allumées, chauffage en marche. » */
export function phrasePiece(hass: HomeAssistant, p: Piece): Phrase {
  const tx = t(hass);
  const morceaux: string[] = [];
  const temp = premiereValeur(hass, p.temperatures);
  const hum = premiereValeur(hass, p.humidites);
  if (temp !== null) morceaux.push(`${degres(hass, temp)}${hum !== null ? ` · ${nombre(hass, hum, 0)} %` : ""}`);
  const etat = (id: string) => hass.states[id]?.state;
  const lum = p.entites.filter((e) => e.domaine === "light" && etat(e.id) === "on").length;
  const vol = p.entites.filter((e) => e.domaine === "cover" && etat(e.id) === "open").length;
  if (lum) morceaux.push(tx.lumieresAllumees(lum));
  if (vol) morceaux.push(tx.voletsOuverts(vol));
  if (p.entites.some((e) => e.domaine === "climate" && ["heat", "heat_cool", "auto"].includes(etat(e.id) ?? ""))) morceaux.push(tx.chauffe);
  if (p.entites.some((e) => e.domaine === "climate" && etat(e.id) === "cool")) morceaux.push(tx.clim);
  if (!lum && !vol && morceaux.length <= 1) morceaux.push(tx.toutEteint.toLowerCase());
  return { phrase: majuscule(tx.piecePhrase(morceaux)), point: BLEU };
}

/** La phrase d'une page thématique : climat, énergie, sécurité, système ou à ranger. */
export function phraseSujet(hass: HomeAssistant, m: Maison, sujet: string): Phrase {
  const tx = t(hass);
  const etat = (id: string | null | undefined) => (id ? hass.states[id] : undefined);
  const nom = (e: { id: string }) => nomCourt(hass, e.id, m.noms);

  if (sujet === "climat") {
    // « Il fait bon partout, sauf dans la chambre (17,9°). 6 chauffages en marche. »
    const pieces = m.pieces.filter((p) => !p.exterieur && !p.annexe && p.temperatures.length)
      .map((p) => ({ p, v: premiereValeur(hass, p.temperatures), c: premiereTemperatureC(hass, p.temperatures) }))
      .filter((x): x is { p: Piece; v: number; c: number } => x.v !== null && x.c !== null);
    const froides = pieces.filter((x) => x.c < 18.5), chaudes = pieces.filter((x) => x.c > 24);
    const ecarts = [...froides, ...chaudes];
    let phrase: string;
    if (!pieces.length) {
      const e = temperatureDehors(hass, m);
      phrase = e !== null ? `${tx.dehorsTitre} ${degres(hass, e)}.` : "";
    } else if (pieces.length === 1) {
      const e = temperatureDehors(hass, m);
      phrase = `${pieces[0].p.name}${tx.deuxPoints}${degres(hass, pieces[0].v)}.${e !== null ? ` ${tx.dehorsTitre}${tx.deuxPoints}${degres(hass, e)}.` : ""}`;
    } else if (!ecarts.length) {
      phrase = tx.bonPartout;
    } else if (ecarts.length <= 2) {
      const liste = ecarts.map((x) => `${x.p.name} (${degres(hass, x.v)})`).join(tx.et);
      phrase = tx.bonPresquePartout(liste);
    } else {
      phrase = tx.horsConfort(ecarts.length);
    }
    const chauffes = m.climats.filter((e) => e.domaine === "climate" && ["heat", "heat_cool", "auto"].includes(etat(e.id)?.state ?? "")).length;
    if (chauffes) phrase += ` ${tx.chauffagesEnMarche(chauffes)}`;
    return { phrase, point: ecarts.length ? ORANGE : VERT };
  }

  if (sujet === "energie") {
    const reseau = etat(m.puissanceReseau);
    const w = Number.parseFloat(reseau?.state ?? "");
    if (Number.isNaN(w)) return { phrase: "", point: BLEU };
    return { phrase: tx.energiePhrase(`${nombre(hass, w, 0)} ${reseau!.attributes.unit_of_measurement || "W"}`), point: BLEU };
  }

  if (sujet === "securite") {
    const ouverts = m.ouvrants.filter((e) => etat(e.id)?.state === "on");
    const alertes = m.alertes.filter((e) => etat(e.id)?.state === "on");
    if (alertes.length) return { phrase: `${tx.fuite}${tx.deuxPoints}${alertes.map(nom).join(", ")}.`, point: ROUGE };
    // Ne pas affirmer « tout est fermé » sans le savoir : un capteur qui ne répond pas le dit.
    const muets = m.ouvrants.filter((e) => ["unavailable", "unknown"].includes(etat(e.id)?.state ?? "unavailable")).length;
    if (!ouverts.length && muets) return { phrase: muets === m.ouvrants.length ? tx.ouverturesMuettes(muets) : `${tx.toutFermePhrase} ${tx.ouverturesMuettes(muets)}`, point: ORANGE };
    if (!ouverts.length) return { phrase: tx.toutFermePhrase, point: VERT };
    const liste = ouverts.slice(0, 2).map(nom).join(tx.et);
    return {
      phrase: tx.ouvertsPhrase(liste, ouverts.length),
      point: ORANGE,
    };
  }

  if (sujet === "systeme") {
    const n = m.majs.filter((e) => etat(e.id)?.state === "on").length;
    const sauvegarde = m.systeme.find((e) => e.plateforme === "backup" && hass.entities[e.id]?.translation_key === "last_successful_automatic_backup");
    const d = sauvegarde ? new Date(etat(sauvegarde.id)?.state ?? "") : null;
    if (!d || Number.isNaN(d.getTime())) {
      return {
        phrase: tx.sansSauvegardePhrase(n ? tx.majs(n) : ""),
        point: ORANGE,
      };
    }
    return {
      phrase: tx.systemeOkPhrase(n ? tx.majs(n) : "", ilYa(hass, d)),
      point: n ? ORANGE : VERT,
    };
  }

  if (sujet === "a-ranger") {
    return {
      phrase: tx.donnerPiece,
      point: BLEU,
    };
  }
  return { phrase: "", point: BLEU };
}

/** « L'air est bon partout. », ou le conseil le plus pressant. */
export function phraseAir(hass: HomeAssistant, m: Maison): Phrase {
  const tx = t(hass);
  const avis = conseils(hass, m).points.filter((p) => p.cle.startsWith("air:")).sort((a, b) => b.niveau - a.niveau);
  return avis.length ? { phrase: `${avis[0].titre} : ${avis[0].detail}`, point: avis[0].niveau >= 2 ? ORANGE : BLEU } : { phrase: tx.airBon, point: VERT };
}

/** « Batterie à 80 %, en charge. » */
export function phraseVehicule(hass: HomeAssistant, m: Maison): Phrase {
  const tx = t(hass);
  const batterie = m.vehicules.find((e) => e.classe === "battery" && e.domaine === "sensor");
  const charge = m.vehicules.find((e) => e.classe === "battery_charging" || (e.domaine === "binary_sensor" && e.classe === "plug"));
  const v = batterie ? Number.parseFloat(hass.states[batterie.id]?.state ?? "") : Number.NaN;
  const enCharge = charge ? hass.states[charge.id]?.state === "on" : false;
  if (Number.isNaN(v)) return { phrase: tx.vehiculeSansBatterie, point: BLEU };
  return { phrase: tx.vehiculeBatterie(nombre(hass, v, 0), enCharge), point: v < 20 ? ORANGE : VERT };
}
