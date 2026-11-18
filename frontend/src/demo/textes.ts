// Les textes propres à la démo du site : le panneau « Essayez », les noms de la maison en
// anglais, et les états affichés par les cartes natives remplacées.

interface TextesDemo {
  utilisateur: string;
  essayez: string;
  aide: string;
  retour: string;
  remettre: string;
  scenarios: Record<string, [string, string]>;
  ailleurs: (page: string) => string;
  plusDInfos: (nom: string, etat: string) => string;
  journalVide: string;
  previsions: string;
  consigne: string;
  noms: Record<string, string>;
  etats: Record<string, string>;
}

export const TEXTES_DEMO: Record<"fr" | "en", TextesDemo> = {
  fr: {
    utilisateur: "Camille",
    essayez: "Essayez",
    aide: "La maison est fictive, le tableau est le vrai : touchez un favori, une pièce, un point à regarder, ou l'un de ces gestes.",
    retour: "Accueil",
    remettre: "Remettre la maison comme au début",
    scenarios: {
      fenetre: ["Ouvrir la fenêtre du salon", "Fermer la fenêtre du salon"],
      fuite: ["Une fuite sous l'évier", "Réparer la fuite"],
      depart: ["Tout le monde part", "Tout le monde rentre"],
      chaleur: ["Une journée de canicule", "Retour à la normale"],
      lumieres: ["Allumer toutes les lumières", "Tout éteindre"],
    },
    ailleurs: (page) => `Dans Home Assistant, ce bouton ouvre ${page}. La démo reste sur le tableau.`,
    plusDInfos: (nom, etat) => `${nom} : ${etat}. Dans Home Assistant, la fenêtre de l'appareil s'ouvre ici.`,
    journalVide: "Rien ne s'est passé depuis l'ouverture de la page.",
    previsions: "Prévisions",
    consigne: "Consigne",
    noms: {},
    etats: {
      on: "Allumé", off: "Éteint", open: "Ouvert", closed: "Fermé", locked: "Verrouillé", unlocked: "Déverrouillé",
      home: "À la maison", not_home: "Absent", playing: "En lecture", paused: "En pause", idle: "Inactif", heat: "Chauffe",
      cool: "Refroidit", heat_cool: "Chauffe ou refroidit", fan_only: "Ventilation", dry: "Déshumidifie", auto: "Automatique", armed_away: "Armée (absence)", armed_home: "Armée (présence)", disarmed: "Désarmée",
      docked: "Sur sa base", cleaning: "Nettoie", unavailable: "Indisponible", unknown: "Inconnu",
      "window.on": "Ouverte", "window.off": "Fermée", "door.on": "Ouverte", "door.off": "Fermée", "moisture.on": "Fuite", "moisture.off": "Sec",
      "smoke.on": "Fumée", "smoke.off": "RAS", "motion.on": "Détecté", "motion.off": "Rien", "occupancy.on": "Présence", "occupancy.off": "Personne",
      "battery.on": "Faible", "battery.off": "Normale",
    },
  },
  en: {
    utilisateur: "Camille",
    essayez: "Try it",
    aide: "The home is fictional, the dashboard is real: tap a favorite, a room, a thing to check, or one of these actions.",
    retour: "Home",
    remettre: "Reset the home",
    scenarios: {
      fenetre: ["Open the living room window", "Close the living room window"],
      fuite: ["A leak under the sink", "Fix the leak"],
      depart: ["Everyone leaves", "Everyone comes back"],
      chaleur: ["A heatwave day", "Back to normal"],
      lumieres: ["Turn on every light", "Turn everything off"],
    },
    ailleurs: (page) => `In Home Assistant, this button opens ${page}. The demo stays on the dashboard.`,
    plusDInfos: (nom, etat) => `${nom}: ${etat}. In Home Assistant, the device's dialog opens here.`,
    journalVide: "Nothing has happened since the page was opened.",
    previsions: "Forecast",
    consigne: "Target",
    noms: {
      Bureau: "Office", Chambre: "Bedroom", "Chambre des enfants": "Kids' room", Cuisine: "Kitchen", Entrée: "Hallway",
      "Salle de bain": "Bathroom", Salon: "Living room", "Appartement d'essai": "Demo apartment", "Aspirateur robot": "Robot vacuum",
      Climatisation: "Air conditioning", "Fuite sous l'évier": "Leak under the sink", "Guirlande lumineuse": "String lights",
      Lampadaire: "Floor lamp", "Lampe de bureau": "Desk lamp", "Lampe de chevet": "Bedside lamp", "Mouvement dans l'entrée": "Hallway motion",
      "Plafonnier de l'entrée": "Hallway ceiling light", "Plafonnier du salon": "Living room ceiling light", "Prise du lave-linge": "Washing machine plug",
      "Qualité de l'air": "Air quality", "Radiateur des enfants": "Kids' heater", "Radiateur du salon": "Living room heater",
      "Réglette du plan de travail": "Worktop light strip", "Température extérieure": "Outdoor temperature", "Volet de la chambre": "Bedroom shutter",
      "Volet de la cuisine": "Kitchen shutter", "Volet du salon": "Living room shutter", "Énergie consommée": "Energy used", Alarme: "Alarm",
      "Chauffe-eau": "Water heater", "Consommation de la maison": "Home consumption", "Détecteur de fumée": "Smoke detector",
      "Enceinte du salon": "Living room speaker", "Fenêtre de la chambre": "Bedroom window", "Fenêtre du salon": "Living room window",
      "Fuite dans la salle de bain": "Bathroom leak", "Humidité chambre": "Bedroom humidity", "Humidité salle de bain": "Bathroom humidity",
      "Humidité salon": "Living room humidity", "Lave-linge": "Washing machine", Maison: "Home", "Pile du capteur de fenêtre": "Window sensor battery",
      "Pile du capteur de porte": "Door sensor battery", "Pile du détecteur de fuite": "Leak sensor battery", "Porte d'entrée": "Front door",
      "Présence dans le salon": "Living room presence", "Puissance du lave-linge": "Washing machine power", "Température bureau": "Office temperature",
      "Température chambre": "Bedroom temperature", "Température chambre des enfants": "Kids' room temperature", "Température cuisine": "Kitchen temperature",
      "Température entrée": "Hallway temperature", "Température salle de bain": "Bathroom temperature", "Température salon": "Living room temperature",
      Ventilateur: "Fan", "Énergie de la maison": "Home energy", "Cours de piano": "Piano lesson",
    },
    etats: {
      on: "On", off: "Off", open: "Open", closed: "Closed", locked: "Locked", unlocked: "Unlocked", home: "Home", not_home: "Away",
      playing: "Playing", paused: "Paused", idle: "Idle", heat: "Heating", cool: "Cooling", heat_cool: "Heat/cool", fan_only: "Fan only", dry: "Dry", auto: "Auto", armed_away: "Armed (away)",
      armed_home: "Armed (home)", disarmed: "Disarmed", docked: "Docked", cleaning: "Cleaning", unavailable: "Unavailable", unknown: "Unknown",
      "window.on": "Open", "window.off": "Closed", "door.on": "Open", "door.off": "Closed", "moisture.on": "Wet", "moisture.off": "Dry",
      "smoke.on": "Smoke", "smoke.off": "Clear", "motion.on": "Detected", "motion.off": "Clear", "occupancy.on": "Detected", "occupancy.off": "Clear",
      "battery.on": "Low", "battery.off": "Normal",
    },
  },
};
