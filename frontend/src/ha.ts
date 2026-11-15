// Les types de Home Assistant dont CentralHome se sert. Home Assistant ne publie pas
// les types de son interface : on décrit ici seulement ce qu'on lit dans l'objet `hass`.

export interface EtatHA {
  entity_id: string;
  state: string;
  attributes: Record<string, any>;
  last_changed?: string;
  last_updated?: string;
}

/** Une entrée de `hass.entities` (registre « d'affichage »). */
export interface EntiteHA {
  entity_id: string;
  platform: string;
  /** Nom propre de l'entité, sans celui de l'appareil. Absent pour la fonction principale d'un appareil. */
  name?: string | null;
  device_id?: string | null;
  area_id?: string | null;
  hidden?: boolean;
  entity_category?: "config" | "diagnostic" | null;
  translation_key?: string | null;
  labels?: string[];
  icon?: string | null;
}

export interface AppareilHA {
  id: string;
  name?: string | null;
  name_by_user?: string | null;
  area_id?: string | null;
  /** Appareils enfants, depuis Home Assistant 2026.9. */
  parent_device_id?: string | null;
  entry_type?: string | null;
  manufacturer?: string | null;
  model?: string | null;
}

export interface PieceHA {
  area_id: string;
  name: string;
  icon?: string | null;
  floor_id?: string | null;
  temperature_entity_id?: string | null;
  humidity_entity_id?: string | null;
}

export interface EtageHA {
  floor_id: string;
  name: string;
  level?: number | null;
  icon?: string | null;
}

export interface ConfigHA {
  location_name?: string;
  latitude: number;
  longitude: number;
  country?: string | null;
  version?: string;
  components?: string[];
}

/** Ce que le moteur de tri lit : les registres et les états, rien d'autre. */
export interface Instantane {
  states: Record<string, EtatHA>;
  entities: Record<string, EntiteHA>;
  devices: Record<string, AppareilHA>;
  areas: Record<string, PieceHA>;
  floors: Record<string, EtageHA>;
}

export interface HomeAssistant extends Instantane {
  config: ConfigHA;
  user?: { id: string; name: string; is_admin: boolean };
  locale?: { language: string };
  language?: string;
  themes?: { darkMode?: boolean; theme?: string };
  panels?: Record<string, unknown>;
  callWS<T = any>(message: Record<string, unknown>): Promise<T>;
  localize?: (cle: string) => string;
  formatEntityState?: (etat: EtatHA) => string;
}
