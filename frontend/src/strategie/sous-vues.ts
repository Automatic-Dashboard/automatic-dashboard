// Les pages derrière l'accueil : une par pièce, puis Climat, Énergie, Sécurité,
// Système et À ranger, chacune ouverte par sa carte Héros.

import type { HomeAssistant } from "../ha";
import { avecLargeurs } from "../mise-en-page/rangees";
import type { Entite, Maison, Mode } from "../moteur/types";
import { energiesMaison } from "../moteur/valeurs";
import { estFrancais, t } from "../outils";
import { aFonction, type CarteConfig, type SectionConfig, section, titre, tuile, vue, type VueConfig } from "./configs";

type AvecReglages = (c: CarteConfig) => CarteConfig;

export function sousVues(hass: HomeAssistant, m: Maison, avecReglages: AvecReglages): VueConfig[] {
  const tx = t(hass);
  const fr = estFrancais(hass);
  const vues: VueConfig[] = [];
  const ouverture = (page: string, extra: Record<string, unknown> = {}) => avecReglages({ type: "custom:centralhome-ouverture", page, ...extra });
  const heros = (page: string) => avecReglages({ type: "custom:centralhome-heros", page });
  const apercu = (sorte: string, grid_options: Record<string, unknown>) => avecReglages({ type: "custom:centralhome-apercu", sorte, grid_options });
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
    const scene = [section([heros("climat"),
      ...(piecesTemp.length >= 2 ? [titre(fr ? "Pièce par pièce" : "Room by room"), avecReglages({ type: "custom:centralhome-confort" })] : [])])];
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
        grid_options: { columns: 12, rows: 4 } });
    }
    if (m.pieces.some((p) => !p.exterieur && p.humidites.length)) cote.push(apercu("humidite", { columns: 12, rows: 2 }));
    const pastilles = piecesTemp.slice(0, 12).map((p) => avecReglages({ type: "custom:centralhome-pastille", sujet: "piece", piece: p.area_id }));
    vues.push(vue({ path: "climat", title: tx.climat, icon: "mdi:thermometer", subview: true, ouverture: ouverture("climat"),
      badges: pastilles, scene, cote, coteApres: 1 }));
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
      cote.push({ type: "distribution", title: fr ? "Répartition" : "Breakdown", entities: appareils.map((e) => e.id), grid_options: { columns: 12, rows: "auto" } });
    }
    const maison = energiesMaison(hass, m);
    if (maison.length) {
      cote.push({ type: "statistics-graph", title: fr ? "7 derniers jours" : "Last 7 days", entities: maison, period: "day", days_to_show: 7,
        chart_type: "bar", stat_types: ["change"], grid_options: { columns: 12, rows: 4 } });
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
      ? [{ type: "logbook", target: { entity_id: suivies }, hours_to_show: 24, title: fr ? "Activité" : "Activity", grid_options: { columns: 12, rows: 6 } }] : [];
    vues.push(vue({ path: "securite", title: tx.securite, icon: "mdi:shield-home-outline", subview: true, ouverture: ouverture("securite"), scene, cote, coteApres: 1 }));
  }

  // Système : Héros, mises à jour, piles (les plus faibles d'abord), machine ; sur le côté, réparations et appareils découverts.
  const valeur = (e: Entite) => Number.parseFloat(etat(e.id) ?? "");
  const piles = [...m.piles].sort((a, b) => valeur(a) - valeur(b));
  const majsDabord = [...m.majs].sort((a, b) => Number(etat(b.id) === "on") - Number(etat(a.id) === "on"));
  const plafond = m.mode === "complet" ? 16 : 8;
  const sceneSysteme = [
    section([heros("systeme")]),
    groupe(tx.misesAJour, majsDabord.slice(0, plafond), "complet"),
    groupe(tx.piles, piles.slice(0, plafond), "complet"),
    groupe(tx.machine, m.systeme.filter((e) => e.plateforme !== "backup" && e.domaine === "sensor").slice(0, 12), "maison"),
  ].filter((s): s is SectionConfig => s !== null);
  vues.push(vue({ path: "systeme", title: tx.systeme, icon: "mdi:server-outline", subview: true, ouverture: ouverture("systeme"), scene: sceneSysteme,
    cote: hass.user?.is_admin
      ? [{ type: "repairs", hide_empty: true, grid_options: { columns: 12 } }, { type: "discovered-devices", hide_empty: true, grid_options: { columns: 12 } }] : [],
    coteApres: 1 }));

  // À ranger : Héros (progression et boutons), puis la liste des appareils par intégration.
  if (m.aRanger.length) {
    vues.push(vue({ path: "a-ranger", title: tx.aRanger, icon: "mdi:tray-arrow-down", subview: true, ouverture: ouverture("a-ranger"),
      scene: [section([heros("a-ranger"), avecReglages({ type: "custom:centralhome-a-ranger" })])] }));
  }
  return vues;
}
