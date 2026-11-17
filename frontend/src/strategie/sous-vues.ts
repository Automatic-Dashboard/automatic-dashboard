// Les pages derrière l'accueil : une par pièce, puis Climat, Énergie, Sécurité,
// Système et À ranger, chacune ouverte par sa carte Héros.

import { aUnBilan } from "../donnees/bilan";
import type { HomeAssistant } from "../ha";
import { avecLargeurs } from "../mise-en-page/rangees";
import type { Entite, Maison, Mode, Reglages } from "../moteur/types";
import { energiesMaison } from "../moteur/valeurs";
import { estFrancais, nomIntegration, t } from "../outils";
import { aFonction, type CarteConfig, type SectionConfig, section, THEME, titre, tuile, vue, type VueConfig } from "./configs";

type AvecReglages = (c: CarteConfig) => CarteConfig;

/** Les intégrations qui décrivent la machine de Home Assistant elle-même. */
const MACHINE = new Set(["systemmonitor", "hassio"]);

export function sousVues(hass: HomeAssistant, m: Maison, avecReglages: AvecReglages, reglages: Reglages = {}): VueConfig[] {
  const tx = t(hass);
  const fr = estFrancais(hass);
  const vues: VueConfig[] = [];
  const ouverture = (page: string, extra: Record<string, unknown> = {}) => avecReglages({ type: "custom:automatic-dashboard-ouverture", page, ...extra });
  const heros = (page: string) => avecReglages({ type: "custom:automatic-dashboard-heros", page });
  const apercu = (sorte: string, grid_options: Record<string, unknown>) => avecReglages({ type: "custom:automatic-dashboard-apercu", sorte, grid_options });
  const etat = (id: string) => hass.states[id]?.state;
  // Un groupe titré de tuiles, en rangées pleines (la dernière élargie au besoin).
  const groupe = (nom: string, entites: Entite[], mode: Mode, titreExtra: Record<string, unknown> = {}): SectionConfig | null => {
    if (!entites.length) return null;
    const tuiles = entites.map((e) => tuile(e, mode));
    return section([titre(nom, titreExtra), ...avecLargeurs(tuiles, 6, "fin", tuiles.some(aFonction) ? 2 : 1)]);
  };
  const bouton = (texte: string, icone: string, action: Record<string, unknown>) =>
    ({ badges: [{ type: "button", text: texte, icon: icone, tap_action: action }] });

  // Les pièces : des groupes par type, le climat de la pièce dans le côté.
  for (const p of m.pieces.filter((x) => x.entites.length)) {
    const de = (f: (e: Entite) => boolean) => p.entites.filter(f);
    const lum = de((e) => e.domaine === "light");
    const vol = de((e) => e.domaine === "cover");
    const clim = de((e) => ["climate", "water_heater", "humidifier"].includes(e.domaine));
    const app = de((e) => e.role === "commande" && !["light", "cover", "climate", "water_heater", "humidifier"].includes(e.domaine) && !e.secondaire);
    const capteurs = de((e) => e.role !== null && ["mesure", "ouvrant", "alerte", "energie"].includes(e.role) && !e.secondaire
      && !p.temperatures.slice(0, 1).includes(e.id) && !p.humidites.slice(0, 1).includes(e.id));
    const autres = m.mode === "complet" ? de((e) => e.secondaire && e.role !== "info") : [];
    const scene = [
      groupe(tx.lumieres, lum, lum.length > 8 ? "complet" : m.mode,
        bouton(tx.toutEteindre, "mdi:lightbulb-off-outline", { action: "perform-action", perform_action: "light.turn_off", target: { area_id: p.area_id } })),
      groupe(tx.volets, vol, m.mode,
        bouton(tx.toutFermer, "mdi:window-shutter", { action: "perform-action", perform_action: "cover.close_cover", target: { area_id: p.area_id } })),
      groupe(tx.appareils, app, m.mode),
      groupe(tx.capteurs, capteurs, m.mode),
      groupe(fr ? "Autres" : "Other", autres, "complet"),
    ].filter((s): s is SectionConfig => s !== null);
    const cote: CarteConfig[] = clim.map((c) => ({ type: c.domaine === "climate" ? "thermostat" : "tile", entity: c.id,
      grid_options: { columns: 12, rows: c.domaine === "climate" ? 4 : 1 } }));
    const mesures = [p.temperatures[0], p.humidites[0]].filter(Boolean);
    if (mesures.length) cote.push({ type: "history-graph", entities: mesures, hours_to_show: 24, grid_options: { columns: 12, rows: 4 } });
    if (!scene.length && !cote.length) continue;
    vues.push(vue({ path: p.area_id, title: p.name, icon: p.icon, subview: true, ouverture: ouverture("piece", { piece: p.area_id }),
      scene: scene.length ? scene : [section([titre(p.name)])], cote, coteApres: 1 }));
  }

  // Climat : Héros, confort pièce par pièce, thermostats en grand par deux (en Moyen en mode Complet).
  const piecesTemp = m.pieces.filter((p) => !p.exterieur && !p.annexe && p.temperatures.length);
  if (piecesTemp.length || m.climats.length) {
    // Les pièces une seule fois : en barres (l'écart au confort) ou en mosaïque colorée, au choix dans les réglages.
    const parPiece = reglages.pieces === "mosaique" ? "custom:automatic-dashboard-plan" : "custom:automatic-dashboard-confort";
    const scene = [section([heros("climat"),
      ...(piecesTemp.length >= 2 ? [titre(fr ? "Pièce par pièce" : "Room by room"), avecReglages({ type: parPiece })] : [])])];
    const thermostats = m.climats.filter((e) => e.domaine === "climate");
    if (thermostats.length) {
      if (m.mode === "complet") {
        scene.push(section([titre(tx.thermostats), ...avecLargeurs(thermostats.map((e) => tuile(e, "maison")), 6, "fin", 2)]));
      } else {
        const cartes: CarteConfig[] = thermostats.map((e) => ({ type: "thermostat", entity: e.id }));
        // Un nombre impair de thermostats : l'historique des températures complète la rangée.
        if (cartes.length % 2 === 1 && piecesTemp.length) {
          cartes.push({ type: "history-graph", entities: piecesTemp.map((p) => p.temperatures[0]).slice(0, 8), hours_to_show: 24 });
        }
        scene.push(section([titre(tx.thermostats), ...cartes.map((c) => ({ ...c, grid_options: { columns: 12, rows: 4 } }))]));
      }
    }
    const cote: CarteConfig[] = [];
    if (m.meteo) {
      cote.push({ type: "weather-forecast", entity: m.meteo, forecast_type: "daily", show_current: true, show_forecast: true,
        ...(hass.config.location_name ? { name: hass.config.location_name } : {}), grid_options: { columns: 12, rows: 4 } });
    }
    if (m.pieces.some((p) => !p.exterieur && p.humidites.length)) cote.push(apercu("humidite", { columns: 12, rows: 2 }));
    vues.push(vue({ path: "climat", title: tx.climat, icon: "mdi:thermometer", subview: true, ouverture: ouverture("climat"),
      scene, cote, coteApres: 1 }));
  }

  // Énergie : Héros, appareils avec leur courbe, compteurs ; sur le côté, la répartition et les 7 derniers jours.
  if (m.energie.length) {
    const appareils = m.energie.filter((e) => e.classe === "power" && e.id !== m.puissanceReseau && e.piece).slice(0, m.mode === "complet" ? 12 : 8);
    const compteurs = m.energie.filter((e) => e.classe === "energy");
    const scene = [section([heros("energie")])];
    if (appareils.length) scene.push(section([titre(tx.appareils), ...avecLargeurs(appareils.map((e) => tuile(e, "maison")), 6, "fin", 2)]));
    if (compteurs.length && m.mode !== "decouverte") {
      scene.push(section([titre(fr ? "Compteurs" : "Meters"), ...avecLargeurs(compteurs.map((e) => tuile(e, "complet")), 6, "fin", 1)]));
    }
    const cote: CarteConfig[] = [];
    if (appareils.length >= 2) {
      cote.push(titre(fr ? "Répartition" : "Breakdown"), { type: "distribution", entities: appareils.map((e) => e.id), grid_options: { columns: 12, rows: "auto" } });
    }
    const maison = energiesMaison(hass, m);
    if (maison.length) {
      cote.push(titre(fr ? "7 derniers jours" : "Last 7 days"), { type: "statistics-graph", entities: maison, period: "day", days_to_show: 7,
        chart_type: "bar", stat_types: ["change"], grid_options: { columns: 12, rows: 4 } });
      cote.push(titre(tx.bilan, bouton(fr ? "Voir" : "See", "mdi:calendar-week", { action: "navigate", navigation_path: "bilan" })));
    }
    vues.push(vue({ path: "energie", title: tx.energie, icon: "mdi:lightning-bolt-outline", subview: true, ouverture: ouverture("energie"), scene, cote, coteApres: 1 }));
  }

  // Sécurité : Héros, ouvertures (ouvertes d'abord), serrures, détecteurs ; sur le côté, l'activité des 24 dernières heures.
  if (m.securite.length) {
    const ouvertsDabord = [...m.ouvrants].sort((a, b) => Number(etat(b.id) === "on") - Number(etat(a.id) === "on"));
    const serrures = m.gardees.filter((e) => e.domaine === "lock");
    const scene = [
      section([heros("securite")]),
      groupe(tx.ouvertures, ouvertsDabord, "complet"),
      groupe(fr ? "Serrures" : "Locks", serrures, "maison"),
      groupe(tx.alertes, m.alertes, "complet"),
      m.mode === "complet" ? groupe(fr ? "Présence" : "Presence", m.gardees.filter((e) => e.role === "presence"), "complet") : null,
    ].filter((s): s is SectionConfig => s !== null);
    const suivies = [...m.ouvrants, ...m.alertes, ...m.gardees.filter((e) => e.domaine === "lock" || e.domaine === "alarm_control_panel")].map((e) => e.id);
    const cote: CarteConfig[] = suivies.length
      ? [titre(fr ? "Activité" : "Activity"), { type: "logbook", target: { entity_id: suivies }, hours_to_show: 24, grid_options: { columns: 12, rows: 6 } }] : [];
    vues.push(vue({ path: "securite", title: tx.securite, icon: "mdi:shield-home-outline", subview: true, ouverture: ouverture("securite"), scene, cote, coteApres: 1 }));
  }

  // Système : Héros, mises à jour, piles (les plus faibles d'abord), machine ; sur le côté, réparations et appareils découverts.
  const valeur = (e: Entite) => Number.parseFloat(etat(e.id) ?? "");
  const piles = [...m.piles].sort((a, b) => valeur(a) - valeur(b));
  const majsDabord = [...m.majs].sort((a, b) => Number(etat(b.id) === "on") - Number(etat(a.id) === "on"));
  const plafond = m.mode === "complet" ? 16 : 8;
  // La machine de Home Assistant, puis un groupe par service du réseau (Glances, Uptime Kuma, AdGuard, Speedtest…).
  const affichables = m.systeme.filter((e) => e.plateforme !== "backup" && ["sensor", "binary_sensor", "switch"].includes(e.domaine));
  const machine = affichables.filter((e) => MACHINE.has(e.plateforme) && e.domaine !== "switch");
  const services = [...new Set(affichables.map((e) => e.plateforme))].filter((p) => !MACHINE.has(p))
    .map((p) => groupe(nomIntegration(hass, p), affichables.filter((e) => e.plateforme === p).slice(0, plafond), "maison"));
  const sceneSysteme = [
    section([heros("systeme")]),
    groupe(tx.misesAJour, majsDabord.slice(0, plafond), "complet"),
    groupe(tx.piles, piles.slice(0, plafond), "complet"),
    groupe(tx.machine, machine.slice(0, 12), "maison"),
    ...services,
  ].filter((s): s is SectionConfig => s !== null);
  vues.push(vue({ path: "systeme", title: tx.systeme, icon: "mdi:server-outline", subview: true, ouverture: ouverture("systeme"), scene: sceneSysteme,
    cote: hass.user?.is_admin
      ? [{ type: "repairs", hide_empty: true, grid_options: { columns: 12 } }, { type: "discovered-devices", hide_empty: true, grid_options: { columns: 12 } }] : [],
    coteApres: 1 }));

  // Le bilan de la semaine : une page à part, annoncée le lundi par un point à regarder.
  if (reglages.bilan !== false && aUnBilan(hass, m)) {
    // Sur le côté, le temps long : l'énergie des huit dernières semaines, les températures des sept derniers jours.
    const energies = energiesMaison(hass, m);
    const temperatures = m.temperaturesInterieures.map((c) => c[0]).slice(0, 6);
    const cote: CarteConfig[] = [
      ...(energies.length ? [titre(fr ? "8 dernières semaines" : "Last 8 weeks"), { type: "statistics-graph", entities: energies, period: "week",
        days_to_show: 56, chart_type: "bar", stat_types: ["change"], grid_options: { columns: 12, rows: 4 } }] : []),
      ...(temperatures.length ? [titre(fr ? "Températures, 7 jours" : "Temperatures, 7 days"), { type: "history-graph", entities: temperatures,
        hours_to_show: 168, grid_options: { columns: 12, rows: 4 } }] : []),
    ];
    vues.push(vue({ path: "bilan", title: tx.bilan, icon: "mdi:calendar-week", subview: true, ouverture: ouverture("bilan"),
      scene: [section([avecReglages({ type: "custom:automatic-dashboard-bilan" })])], cote, coteApres: 1 }));
  }

  // À ranger : Héros (progression et boutons), puis la liste des appareils par intégration.
  if (m.aRanger.length) {
    vues.push(vue({ path: "a-ranger", title: tx.aRanger, icon: "mdi:tray-arrow-down", subview: true, ouverture: ouverture("a-ranger"),
      scene: [section([heros("a-ranger"), avecReglages({ type: "custom:automatic-dashboard-a-ranger" })])] }));
  }
  // Air : les capteurs de l'air, pièce par pièce, et le CO₂ des dernières 24 heures.
  if (m.air.length) {
    const parPiece = [...m.pieces.map((p): [string, Entite[]] => [p.name, m.air.filter((e) => e.piece === p.area_id)]),
      [fr ? "Sans pièce" : "Without area", m.air.filter((e) => !e.piece)] as [string, Entite[]]];
    const co2 = m.air.filter((e) => e.classe === "carbon_dioxide").map((e) => e.id).slice(0, 8);
    vues.push(vue({ path: "air", title: tx.air, icon: "mdi:air-filter", subview: true, ouverture: ouverture("air"),
      scene: parPiece.map(([nom, l]) => groupe(nom, l, "maison")).filter((s): s is SectionConfig => s !== null),
      cote: co2.length ? [titre(fr ? "CO₂, 24 heures" : "CO₂, 24 hours"), { type: "history-graph", entities: co2, hours_to_show: 24,
        grid_options: { columns: 12, rows: 4 } }] : [], coteApres: 1 }));
  }

  // Véhicule : chaque voiture et chaque borne, avec ses mesures.
  if (m.vehicules.length) {
    const parAppareil = new Map<string, Entite[]>();
    for (const e of m.vehicules) {
      const cle = e.appareil ?? e.id;
      if (!parAppareil.has(cle)) parAppareil.set(cle, []);
      parAppareil.get(cle)!.push(e);
    }
    const scene = [...parAppareil].map(([id, l]) => groupe(hass.devices[id]?.name_by_user || hass.devices[id]?.name || tx.vehicule,
      l.filter((e) => !e.secondaire || e.role === "mesure").slice(0, 12), "maison")).filter((s): s is SectionConfig => s !== null);
    vues.push(vue({ path: "vehicule", title: tx.vehicule, icon: "mdi:car-electric-outline", subview: true, ouverture: ouverture("vehicule"), scene }));
  }

  // Extérieur : les pièces du dehors, le portail et le garage, l'arrosage et la piscine, la tondeuse.
  if (m.exterieur.length >= 3) {
    const pris = new Set<string>();
    const prendre = (f: (e: Entite) => boolean) => m.exterieur.filter((e) => !pris.has(e.id) && f(e)).map((e) => (pris.add(e.id), e));
    const portail = prendre((e) => e.domaine === "cover" && ["gate", "garage"].includes(e.classe ?? ""));
    const tondeuse = prendre((e) => e.domaine === "lawn_mower");
    const eau = prendre((e) => e.domaine === "valve" || /arrosage|irrigation|sprinkler|piscine|pool|bassin/i.test(`${e.nomPropre} ${e.etat.attributes.friendly_name ?? ""}`));
    const jardin = prendre(() => true);
    const scene = [
      groupe(fr ? "Le jardin" : "The garden", jardin, "maison"),
      groupe(fr ? "Portail et garage" : "Gate and garage", portail, "maison"),
      groupe(fr ? "Arrosage et piscine" : "Watering and pool", eau, "maison"),
      groupe(fr ? "Tondeuse" : "Mower", tondeuse, "maison"),
    ].filter((s): s is SectionConfig => s !== null);
    const cote: CarteConfig[] = m.meteo ? [{ type: "weather-forecast", entity: m.meteo, forecast_type: "hourly", show_current: true, show_forecast: true,
      ...(hass.config.location_name ? { name: hass.config.location_name } : {}), grid_options: { columns: 12, rows: 4 } }] : [];
    vues.push(vue({ path: "exterieur", title: tx.exterieur, icon: "mdi:tree-outline", subview: true, ouverture: ouverture("exterieur"), scene, cote, coteApres: 1 }));
  }

  // Mes favoris : chacun choisit les siens (hors des onglets, ouverte depuis la rangée des favoris).
  if (m.mode !== "decouverte") {
    vues.push(vue({ path: "mes-favoris", title: tx.mesFavoris, icon: "mdi:star-outline", subview: true, ouverture: ouverture("mes-favoris"),
      scene: [section([avecReglages({ type: "custom:automatic-dashboard-mes-favoris" })])] }));
  }

  // Je pars : ce qui reste ouvert, allumé ou déverrouillé, avec un bouton par geste.
  if (m.mode !== "decouverte" && (m.lumieres.length || m.securite.length)) {
    vues.push(vue({ path: "depart", title: tx.jePars, icon: "mdi:exit-run", subview: true, ouverture: ouverture("depart"),
      scene: [section([avecReglages({ type: "custom:automatic-dashboard-depart" })])] }));
  }

  // La tablette murale : une page pleine (vue « panel »), hors des onglets, à ouvrir sur la tablette.
  vues.push({ path: "tablette", title: fr ? "Tablette murale" : "Wall tablet", icon: "mdi:tablet-dashboard", type: "panel", subview: true,
    theme: THEME, cards: [avecReglages({ type: "custom:automatic-dashboard-tablette" })] } as unknown as VueConfig);
  return vues;
}
