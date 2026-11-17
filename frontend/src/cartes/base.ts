// La base des cartes Automatic Dashboard : configuration, accès à la maison triée, rendu
// économe (on ne redessine que si ce que la carte montre a changé) et masquage de
// la carte quand elle n'a rien à dire.

import { type CSSResultGroup, LitElement, nothing, type PropertyDeclarations, type PropertyValues, type TemplateResult } from "lit";
import { EVENEMENT, suivreIgnores } from "../donnees/ignores";
import type { HomeAssistant } from "../ha";
import { analyserMemo } from "../moteur/analyser";
import type { Maison, Reglages } from "../moteur/types";
import { langue } from "../outils";
import { STYLE_COMMUN } from "./styles";

/** La configuration d'une carte, écrite par la stratégie. */
export interface ConfigCarte {
  type?: string;
  /** Ouverture et Héros : la page (accueil, piece, climat, energie, securite, systeme, a-ranger). */
  page?: string;
  /** Identifiant de la pièce (area_id). */
  piece?: string;
  /** Pastille : le sujet affiché. */
  sujet?: string;
  /** Aperçu : la sorte d'aperçu. */
  sorte?: string;
  reglages?: Reglages;
  grid_options?: Record<string, unknown>;
  [cle: string]: unknown;
}

/** Les options de grille d'une carte dans une vue en sections. */
export interface OptionsGrille {
  columns?: number | "full";
  rows?: number | "auto";
  min_columns?: number;
  max_columns?: number;
  min_rows?: number;
  max_rows?: number;
}

/** Garde les identifiants présents d'une liste qui peut contenir des trous. */
export const definis = (ids: (string | null | undefined)[]): string[] => ids.filter((id): id is string => Boolean(id));

export class CarteAutomatic extends LitElement {
  static override properties: PropertyDeclarations = {
    hass: { attribute: false },
    _config: { state: true },
  };

  static override styles: CSSResultGroup = STYLE_COMMUN;

  declare hass?: HomeAssistant;
  protected declare _config?: ConfigCarte;

  /** La carte est-elle masquée (rien à montrer) ? */
  private _cache = false;
  /** Le dernier rendu n'avait rien à montrer. */
  private _vide = false;

  setConfig(config: ConfigCarte): void {
    this._config = config ?? {};
  }

  // Un point ignoré (ou remontré) sur un écran change la phrase et les points de tous les autres.
  private _surIgnores = () => this.requestUpdate();

  override connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener(EVENEMENT, this._surIgnores);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener(EVENEMENT, this._surIgnores);
  }

  getCardSize(): number {
    return 2;
  }

  /** La maison triée par le moteur (mémorisée : recalculée seulement quand un registre change). */
  get maison(): Maison {
    return analyserMemo(this.hass!, this._config?.reglages ?? {});
  }

  /** Les entités dont la carte dépend : elle ne se redessine que si l'une d'elles change. */
  suivies(_m: Maison): string[] {
    return [];
  }

  /** Ce que la carte doit montrer, ou `null` pour se masquer. */
  protected rendu(_hass: HomeAssistant, _m: Maison): TemplateResult | null {
    return null;
  }

  /** Autre raison de redessiner, propre à une carte (l'heure, la configuration de Home Assistant…). */
  protected autresChangements(_ancien: HomeAssistant): boolean {
    return false;
  }

  // Ne redessine que si la configuration, le thème, la langue, un registre ou l'état d'une entité suivie a changé.
  protected override shouldUpdate(changes: PropertyValues): boolean {
    const hass = this.hass;
    if (!hass || !this._config) return false;
    // Configuration ou données internes (historique arrivé…) : toujours.
    for (const cle of changes.keys()) if (cle !== "hass") return true;
    const ancien = changes.get("hass") as HomeAssistant | undefined;
    if (!ancien) return true;
    if (ancien.themes?.darkMode !== hass.themes?.darkMode || langue(ancien) !== langue(hass)) return true;
    if (ancien.entities !== hass.entities || ancien.devices !== hass.devices || ancien.areas !== hass.areas || ancien.floors !== hass.floors) {
      return true;
    }
    if (this.autresChangements(ancien)) return true;
    return this.suivies(this.maison).some((id) => ancien.states[id] !== hass.states[id]);
  }

  protected override render(): TemplateResult | typeof nothing {
    if (!this.hass || !this._config) return nothing;
    suivreIgnores(this.hass);
    const contenu = this.rendu(this.hass, this.maison);
    this._vide = contenu === null;
    return contenu ?? nothing;
  }

  protected override updated(changes: PropertyValues): void {
    super.updated(changes);
    this.cacher(this._vide);
  }

  // Une carte se masque elle-même, comme la carte native « Réparations » : la section
  // qui la contient disparaît quand toutes ses cartes sont masquées.
  protected cacher(cache: boolean): void {
    if (this._cache === cache) return;
    this._cache = cache;
    this.style.display = cache ? "none" : "";
    this.toggleAttribute("hidden", cache);
    this.dispatchEvent(new CustomEvent("card-visibility-changed", { detail: { value: !cache }, bubbles: true, composed: true }));
  }
}
