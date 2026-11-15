import type { EtageHA, EtatHA, PieceHA } from "../ha";

export type Mode = "decouverte" | "maison" | "complet";

export type Role =
  | "commande" | "ouvrant" | "alerte" | "camera" | "mesure" | "energie" | "presence"
  | "maintenance" | "systeme" | "meteo" | "reglage" | "info";

export type Section = "pieces" | "climat" | "energie" | "securite" | "systeme" | "medias" | "accueil";

/** Réglages de la stratégie, saisis par l'utilisateur. */
export interface Reglages {
  mode?: Mode | "auto";
  masquer?: string[];
  favoris?: string[];
}

/** Une entité, telle que le moteur la juge. */
export interface Entite {
  id: string;
  domaine: string;
  /** État au moment du tri : sert aux attributs fixes (classe, unité). Les valeurs vivantes se lisent dans `hass.states`. */
  etat: EtatHA;
  classe?: string;
  unite?: string;
  piece: string | null;
  appareil: string | null;
  plateforme: string;
  categorie?: string | null;
  /** L'entité porte le nom de son appareil : c'est sa fonction principale. */
  principale: boolean;
  /** Appareil de service (météo, soleil, sauvegarde…) : jamais « à ranger ». */
  service: boolean;
  mobile: boolean;
  nomPropre: string;
  /** Raison pour laquelle l'entité est écartée, ou null si elle est gardée. */
  ecart: string | null;
  role: Role | null;
  section: Section | null;
  secondaire: boolean;
}

export interface Piece extends PieceHA {
  ordre: number;
  icon: string;
  exterieur: boolean;
  annexe: boolean;
  etage: string | null;
  entites: Entite[];
  /** Nombre d'entités utiles dans la pièce. */
  utiles: number;
  /** Candidats ordonnés : la carte prend le premier disponible. */
  temperatures: string[];
  humidites: string[];
}

export interface Compteurs {
  /** Entités utiles. */
  U: number;
  /** Appareils utiles (un enfant compte avec son parent). */
  D: number;
  /** Pièces utiles. */
  P: number;
  /** Entités actives, techniques comprises. */
  T: number;
}

/** Le résultat du tri : tout ce que la stratégie et les cartes lisent. */
export interface Maison {
  toutes: Entite[];
  gardees: Entite[];
  utiles: Entite[];
  pieces: Piece[];
  etages: EtageHA[];
  mode: Mode;
  compteurs: Compteurs;
  meteo: string | null;
  meteoFrance: string | null;
  vigilance: string | null;
  ferie: string | null;
  lune: string | null;
  lumieres: Entite[];
  climats: Entite[];
  temperaturesInterieures: string[][];
  temperaturesExterieures: string[];
  energie: Entite[];
  puissanceReseau: string | null;
  securite: Entite[];
  ouvrants: Entite[];
  alertes: Entite[];
  majs: Entite[];
  piles: Entite[];
  systeme: Entite[];
  aRanger: Entite[];
}
