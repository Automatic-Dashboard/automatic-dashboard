// Le moteur de tri : lit les registres de Home Assistant et rend une `Maison`
// (entités utiles, pièces, sections, mode). Fonction pure, testée sur des maisons
// fictives ; la version mémorisée ne recalcule que si un registre a changé.

import type { Instantane } from "../ha";
import { proposerPiece } from "./ranger";
import { PIECES_ANNEXES, PIECES_EXTERIEURES, PLATEFORMES_OFFICE, classeDe, iconePiece, juger, porte } from "./regles";
import type { Entite, Maison, Mode, Piece, Reglages } from "./types";

const ROLES_UTILES = new Set(["commande", "ouvrant", "alerte", "camera", "mesure", "energie"]);
const ORDRE_METEO = ["meteo_france", "met", "open_meteo"];
const AGENDAS_ECARTES = new Set(["holiday", "workday", "demo"]);
/** Écartée du tri pour une raison technique, mais pas masquée par l'utilisateur. */
const visible = (e: Entite) => e.ecart !== "masquee" && e.ecart !== "masquee_reglage";

/** Le mode, d'après les compteurs structurels (jamais d'après une valeur du moment). */
export function choisirMode(U: number, D: number, P: number, T: number): Mode {
  if (D <= 5 && U <= 15) return "decouverte";
  if (U >= 100 || (U >= 60 && (T >= 250 || P >= 12))) return "complet";
  return "maison";
}

export function analyser(maison: Instantane, reglages: Reglages = {}): Maison {
  const appareils = maison.devices ?? {};
  const masquer = new Set(reglages.masquer ?? []);
  const pieceAppareil = (id: string | null | undefined): string | null => {
    const a = id ? appareils[id] : undefined;
    if (!a) return null;
    // Un appareil enfant sans pièce prend celle de son parent (Home Assistant 2026.9).
    return a.area_id || (a.parent_device_id ? appareils[a.parent_device_id]?.area_id || null : null);
  };
  const racine = (id: string) => appareils[id]?.parent_device_id || id;
  const zones = maison.areas ?? {};

  const toutes: Entite[] = [];
  for (const en of Object.values(maison.entities ?? {})) {
    const etat = maison.states[en.entity_id];
    if (!etat) continue;
    const appareil = en.device_id ? appareils[en.device_id] : undefined;
    const e: Entite = {
      id: en.entity_id,
      domaine: en.entity_id.split(".")[0],
      etat,
      classe: classeDe(etat),
      unite: etat.attributes.unit_of_measurement,
      piece: en.area_id || pieceAppareil(en.device_id),
      appareil: en.device_id || null,
      plateforme: en.platform,
      categorie: en.entity_category ?? null,
      principale: Boolean(en.device_id && !en.name),
      service: appareil?.entry_type === "service",
      mobile: en.platform === "mobile_app",
      nomPropre: en.name ?? "",
      ecart: null,
      role: null,
      section: null,
      secondaire: false,
    };
    // L'étiquette « masquer » se pose sur l'entité, son appareil ou sa pièce : des dizaines d'un coup.
    if (porte(en.labels, "masquer") || porte(appareil?.labels, "masquer") || porte(e.piece ? zones[e.piece]?.labels : null, "masquer")) {
      masquer.add(e.id);
    }
    juger(e, en, masquer);
    toutes.push(e);
  }
  const gardees = toutes.filter((e) => !e.ecart);

  // Les favoris posés par étiquette : l'entité elle-même, ou la fonction principale de l'appareil.
  const favorisEtiquette: string[] = [];
  for (const e of gardees) {
    if (porte(maison.entities[e.id]?.labels, "favori")) favorisEtiquette.push(e.id);
  }
  for (const [id, appareil] of Object.entries(appareils)) {
    if (!porte(appareil.labels, "favori")) continue;
    const siennes = gardees.filter((e) => e.appareil === id);
    const choisie = siennes.find((e) => e.principale) ?? siennes.find((e) => e.role === "commande") ?? siennes[0];
    if (choisie && !favorisEtiquette.includes(choisie.id)) favorisEtiquette.push(choisie.id);
  }

  // Appareil dédié à la mesure : toutes ses entités gardées (hors maintenance) sont des mesures.
  const parAppareil = new Map<string, Entite[]>();
  for (const e of gardees) {
    if (!e.appareil) continue;
    if (!parAppareil.has(e.appareil)) parAppareil.set(e.appareil, []);
    parAppareil.get(e.appareil)!.push(e);
  }
  const dedie = new Set<string>();
  for (const [id, liste] of parAppareil) {
    const hors = liste.filter((e) => e.role !== "maintenance");
    if (hors.length && hors.every((e) => e.role === "mesure")) dedie.add(id);
  }

  // Les quatre compteurs du mode. L'énergie d'un appareil qui a déjà une puissance ne compte pas.
  const avecPuissance = new Set(gardees.filter((e) => e.role === "energie" && (e.classe === "power" || e.classe === "apparent_power"))
    .map((e) => e.appareil).filter(Boolean) as string[]);
  const utiles = gardees.filter((e) => e.role && ROLES_UTILES.has(e.role) && !e.secondaire && !e.service && !PLATEFORMES_OFFICE.has(e.plateforme)
    && !["scene", "script", "group"].includes(e.domaine) && !(e.classe === "energy" && e.appareil && avecPuissance.has(e.appareil)));
  const appareilsUtiles = new Set<string>();
  let sansAppareil = 0;
  for (const e of utiles) e.appareil ? appareilsUtiles.add(racine(e.appareil)) : sansAppareil++;
  const U = utiles.length;
  const D = appareilsUtiles.size + sansAppareil;
  const P = new Set(utiles.map((e) => e.piece).filter(Boolean)).size;
  const T = Object.values(maison.entities ?? {}).filter((en) => !en.hidden).length;
  const mode = reglages.mode && reglages.mode !== "auto" ? reglages.mode : choisirMode(U, D, P, T);

  // Les pièces, dans l'ordre choisi par l'utilisateur, étage par étage.
  const etages = Object.values(maison.floors ?? {}).sort((a, b) => (a.level ?? 0) - (b.level ?? 0));
  const ordreEtage = new Map(etages.map((f, i) => [f.floor_id, i]));
  const pieces: Piece[] = Object.values(zones).filter((a) => !porte(a.labels, "masquer")).map((a, ordre) => {
    const entites = gardees.filter((e) => e.piece === a.area_id && e.role !== "maintenance" && e.role !== "systeme" && e.role !== "meteo");
    // Représentant d'une mesure : celui choisi dans la pièce, puis un thermomètre dédié, puis un capteur seul, puis le reste.
    const rang = (e: Entite) => (a.temperature_entity_id === e.id || a.humidity_entity_id === e.id ? 0
      : e.appareil && (dedie.has(e.appareil) || e.principale) ? 1 : !e.appareil ? 2 : 3);
    const representants = (classe: string) => entites.filter((e) => e.role === "mesure" && e.classe === classe)
      .sort((x, y) => rang(x) - rang(y)).map((e) => e.id);
    return {
      ...a,
      ordre,
      icon: a.icon || iconePiece(a.name),
      exterieur: PIECES_EXTERIEURES.test(a.name) || porte(a.labels, "exterieur"),
      annexe: PIECES_ANNEXES.test(a.name),
      etage: a.floor_id && ordreEtage.has(a.floor_id) ? a.floor_id : null,
      entites,
      utiles: utiles.filter((e) => e.piece === a.area_id).length,
      temperatures: representants("temperature"),
      humidites: representants("humidity"),
    };
  }).sort((a, b) => (ordreEtage.get(a.etage ?? "") ?? 99) - (ordreEtage.get(b.etage ?? "") ?? 99) || a.ordre - b.ordre);

  const parRole = (role: Entite["role"]) => gardees.filter((e) => e.role === role);
  const aRanger = gardees.filter((e) => !e.piece && !e.service && !PLATEFORMES_OFFICE.has(e.plateforme)
    && e.role !== null && ["commande", "ouvrant", "alerte", "mesure", "presence", "camera"].includes(e.role) && (e.principale || !e.appareil));
  // La pièce proposée pour chaque appareil à ranger, d'après son nom (celui de l'utilisateur d'abord).
  const propositions: Record<string, string> = {};
  for (const e of aRanger) {
    const appareil = e.appareil ? appareils[e.appareil] : undefined;
    const piece = proposerPiece(appareil?.name_by_user, pieces) ?? proposerPiece(appareil?.name, pieces)
      ?? proposerPiece(String(e.etat.attributes.friendly_name ?? ""), pieces);
    if (piece) propositions[e.id] = piece;
  }
  const meteos = gardees.filter((e) => e.domaine === "weather").sort((a, b) => {
    const rang = (x: Entite) => (ORDRE_METEO.includes(x.plateforme) ? ORDRE_METEO.indexOf(x.plateforme) : ORDRE_METEO.length);
    return rang(a) - rang(b);
  });
  const energie = parRole("energie");

  return {
    toutes, gardees, utiles, pieces, etages, mode, compteurs: { U, D, P, T }, favorisEtiquette,
    meteo: meteos[0]?.id ?? null,
    // Repérés par leur identifiant, pas par leur état : un capteur indisponible au moment du tri doit rester choisi.
    // La pluie est un capteur d'horodatage, écarté du tri comme technique : on la cherche dans toutes les entités.
    meteoFrance: toutes.find((e) => e.plateforme === "meteo_france" && visible(e)
      && (e.id.endsWith("_next_rain") || e.etat.attributes["1_hour_forecast"]))?.id ?? null,
    vigilance: gardees.find((e) => e.plateforme === "meteo_france"
      && (e.id.endsWith("_weather_alert") || ["Vert", "Jaune", "Orange", "Rouge"].includes(e.etat.state)))?.id ?? null,
    ferie: gardees.find((e) => e.domaine === "calendar" && e.plateforme === "holiday")?.id ?? null,
    lune: gardees.find((e) => e.plateforme === "moon")?.id ?? null,
    lumieres: gardees.filter((e) => e.domaine === "light" && e.piece),
    climats: gardees.filter((e) => ["climate", "water_heater", "humidifier"].includes(e.domaine)),
    temperaturesInterieures: pieces.filter((p) => !p.exterieur && !p.annexe && p.temperatures.length).map((p) => p.temperatures),
    temperaturesExterieures: pieces.filter((p) => p.exterieur).flatMap((p) => p.temperatures),
    energie: energie.filter((e) => !e.secondaire),
    puissanceReseau: choisirReseau(energie),
    securite: gardees.filter((e) => (e.role && ["ouvrant", "alerte", "camera"].includes(e.role)) || e.domaine === "lock" || e.domaine === "alarm_control_panel"),
    ouvrants: parRole("ouvrant"),
    alertes: parRole("alerte"),
    majs: toutes.filter((e) => e.domaine === "update" && !e.ecart),
    piles: toutes.filter((e) => e.role === "maintenance" && e.classe === "battery"),
    systeme: parRole("systeme"),
    aRanger,
    propositions,
    medias: gardees.filter((e) => e.domaine === "media_player" && !Array.isArray(e.etat.attributes.entity_id)),
    // Personnes et minuteurs sont écartés du tri (domaine technique, aide sans pièce), mais « En ce moment » en parle.
    personnes: toutes.filter((e) => e.domaine === "person" && visible(e)).map((e) => e.id),
    agendas: gardees.filter((e) => e.domaine === "calendar" && !AGENDAS_ECARTES.has(e.plateforme)).map((e) => e.id),
    enMarche: [
      ...gardees.filter((e) => ["vacuum", "lawn_mower"].includes(e.domaine) || (e.domaine === "binary_sensor" && e.classe === "running")),
      ...toutes.filter((e) => e.domaine === "timer" && visible(e)),
    ].map((e) => e.id),
    courses: toutes.find((e) => e.domaine === "todo" && e.plateforme === "shopping_list" && visible(e))?.id ?? null,
    noms: Object.fromEntries(Object.entries(reglages.noms ?? {}).filter(([, nom]) => typeof nom === "string" && nom.trim())
      .map(([id, nom]) => [id, nom.trim()])),
  };
}

/** Puissance de toute la maison : celle du compteur, jamais la somme des prises (double compte). */
export function choisirReseau(energie: Entite[]): string | null {
  const puissances = energie.filter((e) => e.classe === "power" || e.classe === "apparent_power");
  const compteur = puissances.find((e) => e.classe === "apparent_power"
    || /linky|compteur|tic\b|meter|grid|r(é|e)seau|maison|home/i.test(e.etat.attributes.friendly_name ?? ""));
  return (compteur ?? puissances.find((e) => !e.piece))?.id ?? null;
}

let memoire: { cle: unknown[]; resultat: Maison } | null = null;

/** Version mémorisée : ne recalcule que si un registre ou un réglage a changé (les états ne changent pas le tri). */
export function analyserMemo(maison: Instantane, reglages: Reglages = {}): Maison {
  const cle = [maison.entities, maison.devices, maison.areas, maison.floors, reglages.mode, (reglages.masquer ?? []).join(),
    JSON.stringify(reglages.noms ?? {})];
  if (memoire && cle.every((v, i) => v === memoire!.cle[i])) return memoire.resultat;
  const resultat = analyser(maison, reglages);
  memoire = { cle, resultat };
  return resultat;
}
