// Des conseils, pas seulement des constats : ce que la maison suggère de faire, quand deux
// faits se croisent (une fenêtre ouverte pendant que le chauffage tourne) ou qu'une mesure
// dépasse un seuil de bon sens (CO₂, humidité). Chaque conseil est un point à regarder.

import type { HomeAssistant } from "../ha";
import { degres, estFrancais, majuscule, nombre, nomCourt, t } from "../outils";
import { premiereTemperatureC, premiereValeur, temperatureDehors, temperatureDehorsC } from "./valeurs";
import type { Point } from "./points";
import type { Entite, Maison } from "./types";

/** Seuils de l'air intérieur : au-delà de 1 000 ppm on aère, au-delà de 1 500 c'est urgent. */
export const CO2_AERER = 1000;
export const CO2_URGENT = 1500;
/** Au-delà, l'humidité d'une pièce favorise la moisissure. */
export const HUMIDITE_AERER = 80;

// Le nom commun en tête du nom donne l'article : « Chambre de Léa » → « la chambre de Léa ».
const NOMS_FR: [RegExp, string][] = [
  [/^(chambre|cuisine|salle|buanderie|cave|mezzanine|v(é|e)randa|terrasse|piscine|fen(ê|e)tre|porte|baie|lucarne|trappe|machine)\b/i, "la "],
  [/^(salon|bureau|s(é|e)jour|couloir|garage|grenier|cellier|dressing|hall|palier|jardin|balcon|patio|velux|portail|volet|garde-manger|wc|lave-linge|lave-vaisselle|s(è|e)che-linge|four)\b/i, "le "],
  [/^(entr(é|e)e|(é|e)tage|atelier|abri|escalier)\b/i, "l'"],
];
const NOMS_EN = /^(bedroom|kitchen|living|bathroom|office|hall|hallway|garage|attic|basement|cellar|laundry|dining|nursery|guest|master|kids?|window|door|patio|garden|terrace|balcony|washer|washing|dryer|dishwasher|oven)\b/i;

/** Ce qui ressemble à une machine dont on attend la fin. */
const MACHINES = /lave-linge|lave-vaisselle|s(è|e)che-linge|machine (à|a) laver|washer|washing machine|dryer|dishwasher/i;
/** Au-delà, une machine finie n'est plus une nouvelle. */
const MACHINE_FINIE_DEPUIS = 2 * 3600000;
/** Il fait chaud : au-delà, dehors et dedans, on garde la fraîcheur (en °C, une maison en °F est convertie). */
export const CHAUD_DEHORS = 25;
export const CHAUD_DEDANS = 24;

/**
 * « la chambre de Léa », « l'entrée », « the bedroom » ; null si le nom n'est pas un nom
 * commun connu (« Atelier Paul » oui, « Chez Léa » non) : la phrase s'écrit alors sans article.
 */
export function avecArticle(nom: string, fr: boolean): string | null {
  const minuscule = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
  if (!fr) return NOMS_EN.test(nom) ? `the ${minuscule(nom)}` : null;
  const trouve = NOMS_FR.find(([motif]) => motif.test(nom));
  return trouve ? `${trouve[1]}${minuscule(nom)}` : null;
}

/** Le chauffage tourne-t-il ? L'action en cours si l'appareil la donne, sinon son mode. */
export function chauffe(etat: { state: string; attributes: Record<string, any> } | undefined): boolean {
  if (!etat || ["off", "unavailable", "unknown"].includes(etat.state)) return false;
  const action = etat.attributes.hvac_action;
  if (action) return action === "heating" || action === "preheating";
  return ["heat", "heat_cool", "auto"].includes(etat.state);
}

/** Les conseils du moment, et les ouvertures qu'ils remplacent (pas deux points pour la même fenêtre). */
export function conseils(hass: HomeAssistant, m: Maison): { points: Point[]; remplaces: Set<string> } {
  const fr = estFrancais(hass);
  const tx = t(hass);
  const etat = (id: string) => hass.states[id];
  const points: Point[] = [];
  const remplaces = new Set<string>();

  // 1. Une fenêtre ouverte dans une pièce chauffée (ou n'importe où, si le chauffage est central).
  const chauffages = m.climats.filter((e) => e.domaine === "climate" && chauffe(etat(e.id)));
  const central = chauffages.some((e) => !e.piece);
  for (const o of m.ouvrants) {
    if (etat(o.id)?.state !== "on") continue;
    if (!central && !chauffages.some((c) => c.piece && c.piece === o.piece)) continue;
    const nom = nomCourt(hass, o.id, m.noms);
    const article = avecArticle(nom, fr);
    points.push({
      cle: `ouvrant:${o.id}`, niveau: 2, icone: "mdi:radiator", conseil: true, securite: true,
      titre: article ? tx.fermer(article) : `${tx.fermerSans} : ${nom}`, detail: tx.chauffageOuvert, entite: o.id,
    });
    remplaces.add(o.id);
  }

  // 2. L'air d'une pièce : le CO₂, puis l'humidité (une pièce, un conseil).
  for (const p of m.pieces.filter((x) => !x.exterieur)) {
    const mesure = (classe: string) => p.entites.filter((e: Entite) => e.role === "mesure" && e.classe === classe)
      .map((e) => [e.id, Number.parseFloat(etat(e.id)?.state ?? "")] as const).filter(([, v]) => !Number.isNaN(v))
      .sort((a, b) => b[1] - a[1])[0];
    const article = avecArticle(p.name, fr);
    const aerer = article ? tx.aerer(article) : `${tx.aererSans} : ${p.name}`;
    const co2 = mesure("carbon_dioxide");
    if (co2 && co2[1] >= CO2_AERER) {
      points.push({ cle: `air:${p.area_id}`, niveau: co2[1] >= CO2_URGENT ? 2 : 1, icone: "mdi:molecule-co2", conseil: true,
        titre: aerer, detail: tx.co2(nombre(hass, co2[1], 0)), entite: co2[0] });
      continue;
    }
    const humidite = mesure("humidity");
    if (humidite && humidite[1] >= HUMIDITE_AERER) {
      points.push({ cle: `air:${p.area_id}`, niveau: 1, icone: "mdi:water-percent", conseil: true,
        titre: aerer, detail: tx.humidite(nombre(hass, humidite[1], 0)), entite: humidite[0] });
    }
  }
  // 3. Selon la saison : fermer les volets quand il fait chaud dehors, ouvrir quand il fait plus frais dehors.
  const dehors = temperatureDehors(hass, m);
  const soleilLeve = hass.states["sun.sun"]?.state === "above_horizon";
  const heureNow = new Date().getHours();
  let fraicheurProposee = false;
  for (const p of m.pieces.filter((x) => !x.exterieur && !x.annexe)) {
    const dedans = premiereValeur(hass, p.temperatures);
    if (dehors === null || dedans === null) continue;
    const dehorsC = temperatureDehorsC(hass, m)!, dedansC = premiereTemperatureC(hass, p.temperatures)!;
    const voletsOuverts = p.entites.filter((e) => e.domaine === "cover" && !["garage", "gate", "door"].includes(e.classe ?? "")
      && etat(e.id)?.state === "open");
    const article = avecArticle(p.name, fr);
    if (soleilLeve && dehorsC >= CHAUD_DEHORS && dedansC >= CHAUD_DEDANS && voletsOuverts.length) {
      points.push({ cle: `volets:${p.area_id}`, niveau: 1, icone: "mdi:weather-sunny-alert", conseil: true,
        titre: article ? tx.fermerVolets(article) : `${tx.fermerVoletsSans} : ${p.name}`,
        detail: tx.chaleur(degres(hass, dehors), degres(hass, dedans)), entite: voletsOuverts[0].id });
    } else if (!fraicheurProposee && dedansC >= CHAUD_DEDANS && dehorsC <= dedansC - 2 && (heureNow >= 18 || heureNow < 10)
      && !m.ouvrants.some((o) => o.piece === p.area_id && etat(o.id)?.state === "on")) {
      fraicheurProposee = true;
      points.push({ cle: "fraicheur", niveau: 1, icone: "mdi:weather-windy", conseil: true, titre: tx.ouvrirFrais,
        detail: tx.fraisDehors(degres(hass, dehors), degres(hass, dedans)) });
    }
  }

  // 4. Une machine qui vient de finir : « Le lave-linge est fini depuis 20 min ».
  const maintenant = Date.now();
  for (const e of m.gardees.filter((x) => x.domaine === "binary_sensor" && x.classe === "running")) {
    const s = etat(e.id);
    const nom = nomCourt(hass, e.id, m.noms);
    const appareil = e.appareil ? hass.devices[e.appareil] : undefined;
    const nomAppareil = appareil?.name_by_user || appareil?.name || nom;
    if (s?.state !== "off" || !s.last_changed || !MACHINES.test(`${nom} ${nomAppareil}`)) continue;
    const depuis = maintenant - new Date(s.last_changed).getTime();
    if (depuis < 0 || depuis > MACHINE_FINIE_DEPUIS) continue;
    const article = avecArticle(nomAppareil, fr);
    points.push({ cle: `machine:${e.id}`, niveau: 1, icone: "mdi:washing-machine", conseil: true,
      titre: article ? tx.machineFinie(majuscule(article)) : `${tx.machineFinieSans} : ${nomAppareil}`,
      detail: tx.depuis(Math.max(1, Math.round(depuis / 60000))), entite: e.id });
  }
  return { points, remplaces };
}
