// L'éditeur des réglages : Home Assistant l'ouvre par « Modifier le tableau de bord »
// (dialogue natif, avec ses boutons Enregistrer et Annuler et son mode YAML). Il règle
// le mode, les favoris épinglés et leur ordre, ce qui est masqué et les noms affichés.
// L'ordre des pièces reste celui de Home Assistant : on y renvoie.

import { css, html, LitElement, nothing, type PropertyDeclarations, type TemplateResult } from "lit";
import type { HomeAssistant } from "../ha";
import { copier, diagnostiquer, LIMITE_COLLER, telecharger, texteDiagnostic, TICKET_CLASSEMENT } from "../diagnostic";
import { analyser } from "../moteur/analyser";
import type { Maison } from "../moteur/types";
import { estFrancais, naviguer, nomCourt } from "../outils";
import { favorisAutomatiques, nombreDeFavoris } from "../strategie/accueil";
import type { ConfigStrategie } from "../strategie/strategie";
import { EDITEUR } from "../textes";
import { demasquer, deplacer, desepingler, epingler, masquer, nettoyer, renommer } from "./reglages";

const MODES = ["auto", "decouverte", "maison", "complet"] as const;

/**
 * Les composants natifs dont l'éditeur se sert (choix d'une entité, glisser-déposer,
 * champ de texte) ne sont chargés par Home Assistant qu'à la demande : l'éditeur de la
 * carte « entités » les charge tous.
 */
async function chargerComposants(): Promise<void> {
  if (["ha-entity-picker", "ha-sortable", "ha-selector", "ha-switch"].every((b) => customElements.get(b))) return;
  try {
    const aides = await (window as unknown as { loadCardHelpers?: () => Promise<any> }).loadCardHelpers?.();
    const carte = await aides?.createCardElement({ type: "entities", entities: [] });
    await carte?.constructor?.getConfigElement?.();
  } catch {
    // Sans eux, l'éditeur YAML de Home Assistant reste disponible.
  }
}

export class AutomaticEditeur extends LitElement {
  static override properties: PropertyDeclarations = {
    hass: { attribute: false },
    _config: { state: true },
    _auto: { state: true },
    _enCours: { state: true },
    _pret: { state: true },
    _signales: { state: true },
    _copie: { state: true },
  };

  declare hass?: HomeAssistant;
  private declare _config?: ConfigStrategie;
  /** Les favoris que Home Assistant propose en ce moment (commandes habituelles). */
  private declare _auto: string[];
  /** Les entités qu'on est en train de renommer (le champ reste même vidé). */
  private declare _enCours: string[];
  private declare _pret: boolean;
  /** Les entités que l'utilisateur signale dans le diagnostic. */
  private declare _signales: string[];
  /** Le résultat de la dernière copie du diagnostic. */
  private declare _copie: "" | "copie" | "echec" | "long";

  /** Ce qui était masqué quand on a demandé les favoris proposés (null : jamais demandés). */
  private _cleAuto: string | null = null;
  /** La configuration à l'ouverture de l'éditeur. */
  private _enregistree?: string;
  private _memo?: { cle: unknown[]; maison: Maison };

  constructor() {
    super();
    this._auto = [];
    this._enCours = [];
    this._pret = false;
    this._signales = [];
    this._copie = "";
  }

  setConfig(config: ConfigStrategie): void {
    this._config = config ?? {};
    // Home Assistant rappelle setConfig après chaque changement : seule la première est la configuration enregistrée.
    this._enregistree ??= JSON.stringify(nettoyer(this._config));
  }

  /** Des changements pas encore enregistrés ? */
  private get modifie(): boolean {
    return JSON.stringify(nettoyer(this._config ?? {})) !== this._enregistree;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    chargerComposants().then(() => (this._pret = true));
  }

  /** La maison telle que le mode automatique la voit (sans le mode forcé, avec ce qui est masqué). */
  private get maison(): Maison {
    const h = this.hass!;
    const masques = this._config?.masquer ?? [];
    const cle = [h.entities, h.devices, h.areas, h.floors, masques.join()];
    if (!this._memo || cle.some((v, i) => v !== this._memo!.cle[i])) {
      this._memo = { cle, maison: analyser(h, { masquer: masques }) };
    }
    return this._memo.maison;
  }

  protected override updated(): void {
    // Les favoris proposés dépendent de ce qui est masqué : on les redemande quand ça change.
    if (!this.hass || !this._config) return;
    const cle = (this._config.masquer ?? []).join();
    if (cle === this._cleAuto) return;
    this._cleAuto = cle;
    favorisAutomatiques(this.hass, this.maison).then((ids) => (this._auto = ids));
  }

  private changer(config: ConfigStrategie): void {
    this._config = nettoyer(config);
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true }));
  }

  private get tx() {
    return estFrancais(this.hass) ? EDITEUR.fr : EDITEUR.en;
  }

  protected override render(): TemplateResult | typeof nothing {
    if (!this.hass || !this._config) return nothing;
    return html`<div class="editeur">${this.mode()}${this.favoris()}${this.masques()}${this.noms()}${this.pieces()}${this.tablette()}${this.signaler()}</div>`;
  }

  private mode(): TemplateResult {
    const tx = this.tx;
    const m = this.maison;
    const choisi = this._config!.mode ?? "auto";
    const { U, D, P } = m.compteurs;
    return html`<section>
      <h3>${tx.mode}</h3>
      <p class="aide">${tx.detecte(tx.nomsModes[m.mode], U, D, P)}</p>
      <div class="modes" role="radiogroup" aria-label=${tx.mode}>
        ${MODES.map((mode) => {
          const [titre, description] = tx.modes[mode];
          return html`<button role="radio" aria-checked=${choisi === mode ? "true" : "false"} class=${choisi === mode ? "choisi" : ""}
            @click=${() => this.changer({ ...this._config!, mode })}>
            <span class="titre"><span class="rond"></span>${titre}${mode === "auto" ? html`<em>${tx.nomsModes[m.mode]}</em>` : nothing}</span>
            <span class="description">${description}</span></button>`;
        })}
      </div></section>`;
  }

  private favoris(): TemplateResult {
    const tx = this.tx;
    const c = this._config!;
    const hass = this.hass!;
    const epingles = (c.favoris ?? []).filter((id) => hass.states[id]);
    // Posés par l'étiquette « favori » dans Home Assistant : montrés, mais réglés là-bas.
    const parEtiquette = this.maison.favorisEtiquette.filter((id) => !epingles.includes(id) && hass.states[id]);
    const fixes = epingles.length + parEtiquette.length;
    const completer = c.completer !== false;
    const autres = completer ? this._auto.filter((id) => !epingles.includes(id) && !parEtiquette.includes(id)) : [];
    const proposes = autres.slice(0, Math.max(0, nombreDeFavoris(fixes, autres.length) - fixes));
    const decouverte = (c.mode && c.mode !== "auto" ? c.mode : this.maison.mode) === "decouverte";
    return html`<section>
      <h3>${tx.favoris}</h3>
      <p class="aide">${tx.favorisAide}</p>
      ${decouverte ? html`<p class="note"><ha-icon icon="mdi:information-outline"></ha-icon>${tx.favorisDecouverte}</p>` : nothing}
      ${fixes || proposes.length
        ? html`<ha-sortable handle-selector=".poignee" draggable-selector=".epingle" @item-moved=${this.deplacerFavori}>
            <div class="tuiles">
              ${epingles.map((id) => this.tuile(id, "epingle"))}
              ${parEtiquette.map((id) => this.tuile(id, "etiquette"))}
              ${proposes.map((id) => this.tuile(id, "propose"))}
            </div></ha-sortable>`
        : html`<p class="vide">${tx.aucunFavori}</p>`}
      ${this.choix(tx.ajouterFavori, [...epingles, ...(c.masquer ?? [])], (id) => this.changer(epingler(c, id)))}
      <label class="interrupteur">
        <ha-switch .checked=${completer} @change=${(ev: Event) => this.changer({ ...c, completer: (ev.target as HTMLInputElement).checked })}></ha-switch>
        <span>${tx.completer}<small>${tx.completerAide}</small></span>
      </label></section>`;
  }

  private tuile(id: string, genre: "epingle" | "etiquette" | "propose"): TemplateResult {
    const epingle = genre === "epingle";
    const tx = this.tx;
    const hass = this.hass!;
    const etat = hass.states[id];
    const piece = hass.areas[hass.entities[id]?.area_id || hass.devices[hass.entities[id]?.device_id ?? ""]?.area_id || ""];
    const nom = nomCourt(hass, id, this._config!.noms ?? {});
    return html`<div class=${`tuile ${genre}`}>
      <span class="haut">${epingle ? html`<button class="poignee" title=${tx.deplacer(nom)} aria-label=${tx.deplacer(nom)}
          @keydown=${(ev: KeyboardEvent) => this.deplacerAuClavier(ev, id)}><ha-icon icon="mdi:drag-vertical"></ha-icon></button>` : nothing}
        <span class="icone"><ha-state-icon .hass=${hass} .stateObj=${etat}></ha-state-icon></span></span>
      <span class="nom"><span class="libelle">${nom}</span><small>${genre === "propose" ? tx.propose : genre === "etiquette" ? tx.parEtiquette : piece?.name ?? ""}</small></span>
      ${genre === "etiquette"
        ? html`<span class="rond-bouton" title=${tx.parEtiquetteAide}><ha-icon icon="mdi:label-outline"></ha-icon></span>`
        : epingle
        ? html`<button class="rond-bouton" title=${tx.retirer} aria-label=${`${tx.retirer} ${nom}`}
            @click=${() => this.changer(desepingler(this._config!, id))}><ha-icon icon="mdi:close"></ha-icon></button>`
        : html`<button class="rond-bouton" title=${tx.epingler} aria-label=${`${tx.epingler} ${nom}`}
            @click=${() => this.changer(epingler(this._config!, id))}><ha-icon icon="mdi:pin-outline"></ha-icon></button>`}
    </div>`;
  }

  private deplacerFavori = (ev: CustomEvent<{ oldIndex: number; newIndex: number }>): void => {
    ev.stopPropagation();
    const epingles = (this._config!.favoris ?? []).filter((id) => this.hass!.states[id]);
    const { oldIndex, newIndex } = ev.detail;
    // Déposé parmi les proposés : il devient le dernier des épinglés.
    this.changer({ ...this._config!, favoris: deplacer(epingles, oldIndex, Math.min(newIndex, epingles.length - 1)) });
  };

  // Sans souris : les flèches déplacent le favori d'une place.
  private deplacerAuClavier(ev: KeyboardEvent, id: string): void {
    const pas = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[ev.key];
    if (!pas) return;
    ev.preventDefault();
    const epingles = (this._config!.favoris ?? []).filter((x) => this.hass!.states[x]);
    const de = epingles.indexOf(id);
    const vers = de + pas;
    if (de < 0 || vers < 0 || vers >= epingles.length) return;
    this.changer({ ...this._config!, favoris: deplacer(epingles, de, vers) });
    this.updateComplete.then(() => (this.renderRoot.querySelectorAll<HTMLElement>(".poignee")[vers])?.focus());
  }

  private masques(): TemplateResult {
    const tx = this.tx;
    const c = this._config!;
    const hass = this.hass!;
    const liste = c.masquer ?? [];
    return html`<section>
      <h3>${tx.masques}</h3>
      <p class="aide">${tx.masquesAide}</p>
      ${liste.length
        ? html`<div class="puces">${liste.map((id) => html`<span class="puce">
            ${hass.states[id] ? html`<ha-state-icon .hass=${hass} .stateObj=${hass.states[id]}></ha-state-icon>` : nothing}
            ${nomCourt(hass, id)}
            <button class="rond-bouton" title=${tx.retirer} aria-label=${`${tx.retirer} ${nomCourt(hass, id)}`}
              @click=${() => this.changer(demasquer(c, id))}><ha-icon icon="mdi:close"></ha-icon></button></span>`)}</div>`
        : html`<p class="vide">${tx.aucunMasque}</p>`}
      ${(() => {
        const n = this.maison.toutes.filter((e) => e.ecart === "masquee_reglage" && !liste.includes(e.id)).length;
        return n ? html`<p class="note"><ha-icon icon="mdi:label-outline"></ha-icon>${tx.masquesEtiquette(n)}</p>` : nothing;
      })()}
      ${this.choix(tx.masquer, liste, (id) => this.changer(masquer(c, id)))}</section>`;
  }

  private noms(): TemplateResult {
    const tx = this.tx;
    const c = this._config!;
    const hass = this.hass!;
    const ids = [...new Set([...Object.keys(c.noms ?? {}), ...this._enCours])];
    return html`<section>
      <h3>${tx.noms}</h3>
      <p class="aide">${tx.nomsAide}</p>
      ${ids.map((id) => html`<div class="renomme">
        <span class="icone">${hass.states[id] ? html`<ha-state-icon .hass=${hass} .stateObj=${hass.states[id]}></ha-state-icon>` : nothing}</span>
        <ha-selector .hass=${hass} .selector=${{ text: {} }} .value=${c.noms?.[id] ?? ""} .required=${false}
          .label=${tx.nomTableau} .helper=${tx.nomDansHA(nomCourt(hass, id))}
          @value-changed=${(ev: CustomEvent<{ value?: string }>) => this.changer(renommer(this._config!, id, ev.detail.value ?? ""))}></ha-selector>
        <button class="rond-bouton" title=${tx.retirer} aria-label=${`${tx.retirer} ${nomCourt(hass, id)}`}
          @click=${() => { this._enCours = this._enCours.filter((x) => x !== id); this.changer(renommer(this._config!, id, "")); }}>
          <ha-icon icon="mdi:close"></ha-icon></button></div>`)}
      ${this.choix(tx.renommer, ids, (id) => (this._enCours = [...this._enCours, id]))}</section>`;
  }

  private pieces(): TemplateResult {
    const tx = this.tx;
    const modifie = this.modifie;
    return html`<section class="pieces">
      <div><h3>${tx.pieces}</h3><p class="aide">${modifie ? tx.enregistrerDabord : tx.piecesAide}</p></div>
      <button class="lien" ?disabled=${modifie} @click=${this.ouvrirPieces}>${tx.changerOrdre}<ha-icon icon="mdi:arrow-right"></ha-icon></button>
    </section>`;
  }

  // La tablette murale : une page du tableau, à ouvrir sur la tablette (et à garder ouverte).
  private tablette(): TemplateResult {
    const tx = this.tx;
    const modifie = this.modifie;
    const page = `${location.pathname.split("/")[1]}/tablette`;
    return html`<section class="pieces">
      <div><h3>${tx.tablette}</h3><p class="aide">${modifie ? tx.enregistrerDabord : tx.tabletteAide(`/${page}`)}</p></div>
      <button class="lien" ?disabled=${modifie} @click=${() => this.ouvrir(`/${page}`)}>${tx.ouvrirTablette}<ha-icon icon="mdi:arrow-right"></ha-icon></button>
    </section>`;
  }

  private ouvrirPieces = (): void => this.ouvrir("/config/areas/dashboard");

  // Une autre page : le dialogue ne se ferme pas tout seul en changeant de page, on le ferme
  // d'abord (rien n'est perdu, le lien est désactivé tant qu'il reste des changements à enregistrer).
  private ouvrir(chemin: string): void {
    let noeud: Node = this;
    for (let hote = (noeud.getRootNode() as ShadowRoot).host; hote; hote = (noeud.getRootNode() as ShadowRoot).host) {
      const dialogue = hote as Element & { closeDialog?: () => void };
      if (typeof dialogue.closeDialog === "function") {
        dialogue.closeDialog();
        break;
      }
      noeud = hote;
    }
    naviguer(chemin);
  }

  // Signaler un problème : la maison décrite sans noms ni valeurs, avec les entités en cause,
  // à joindre au ticket. Rien ne part tout seul : l'utilisateur copie ou télécharge, et relit s'il veut.
  private signaler(): TemplateResult {
    const tx = this.tx;
    const hass = this.hass!;
    const ids = this._signales.filter((id) => hass.states[id]);
    const message = { copie: tx.copie, echec: tx.copieEchec, long: tx.tropLong, "": "" }[this._copie];
    return html`<section class="signaler">
      <h3>${tx.signaler}</h3>
      <p class="aide">${tx.signalerAide}</p>
      ${ids.length
        ? html`<div class="puces">${ids.map((id) => html`<span class="puce">
            <ha-state-icon .hass=${hass} .stateObj=${hass.states[id]}></ha-state-icon>${nomCourt(hass, id)}
            <button class="rond-bouton" title=${tx.retirer} aria-label=${`${tx.retirer} ${nomCourt(hass, id)}`}
              @click=${() => { this._signales = this._signales.filter((x) => x !== id); this._copie = ""; }}>
              <ha-icon icon="mdi:close"></ha-icon></button></span>`)}</div>`
        : nothing}
      ${this.choix(tx.signalerChoisir, ids, (id) => { this._signales = [...this._signales, id]; this._copie = ""; })}
      <div class="actions">
        <button class="lien" @click=${this.telechargerDiagnostic}><ha-icon icon="mdi:download"></ha-icon>${tx.telecharger}</button>
        <button class="lien" @click=${this.copierDiagnostic}><ha-icon icon="mdi:content-copy"></ha-icon>${tx.copier}</button>
        <a class="lien" href=${TICKET_CLASSEMENT} target="_blank" rel="noreferrer">${tx.ouvrirTicket}<ha-icon icon="mdi:open-in-new"></ha-icon></a>
      </div>
      ${message ? html`<p class="retour" role="status">${message}</p>` : nothing}
    </section>`;
  }

  private texteDiagnostic(): string {
    const c = this._config ?? {};
    return texteDiagnostic(diagnostiquer(this.hass!, { mode: c.mode, masquer: c.masquer, favoris: c.favoris, completer: c.completer }, this._signales));
  }

  private copierDiagnostic = async (): Promise<void> => {
    const texte = this.texteDiagnostic();
    const ok = await copier(texte, this.renderRoot);
    this._copie = !ok ? "echec" : texte.length > LIMITE_COLLER ? "long" : "copie";
  };

  private telechargerDiagnostic = (): void => {
    telecharger(this.texteDiagnostic());
    this._copie = "";
  };

  /** Le bouton « Ajouter » natif : choisir une entité dans la liste, avec recherche. */
  private choix(libelle: string, exclues: string[], ajouter: (id: string) => void): TemplateResult | typeof nothing {
    if (!this._pret || !customElements.get("ha-entity-picker")) return nothing;
    return html`<ha-entity-picker class="ajout" .hass=${this.hass} .addButton=${true} .addButtonLabel=${libelle} .excludeEntities=${exclues}
      @value-changed=${(ev: CustomEvent<{ value?: string }>) => {
        ev.stopPropagation();
        if (ev.detail.value) ajouter(ev.detail.value);
      }}></ha-entity-picker>`;
  }

  static override styles = css`
    :host{display:block;container-type:inline-size}
    .editeur{display:flex;flex-direction:column;gap:30px;padding:4px 0 20px}
    section{display:flex;flex-direction:column;gap:10px}
    section + section{padding-top:26px;border-top:1px solid var(--divider-color)}
    h3{margin:0;font-size:16px;font-weight:600;color:var(--primary-text-color)}
    .aide{margin:-4px 0 0;font-size:13.5px;line-height:1.45;color:var(--secondary-text-color)}
    .vide{margin:0;font-size:13.5px;color:var(--secondary-text-color);font-style:italic}
    .note{display:flex;gap:8px;margin:0;padding:10px 12px;border-radius:10px;font-size:13px;line-height:1.4;
      background:color-mix(in srgb, var(--primary-color) 9%, transparent);color:var(--primary-text-color)}
    .note ha-icon{--mdc-icon-size:18px;color:var(--primary-color);flex:none}
    button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}
    button:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}

    .modes{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:4px}
    .modes button{display:flex;flex-direction:column;gap:5px;text-align:left;padding:12px 12px 13px;border-radius:12px;
      border:1px solid var(--divider-color);transition:border-color .15s, background-color .15s}
    .modes button:hover{border-color:color-mix(in srgb, var(--primary-color) 50%, var(--divider-color))}
    .modes button.choisi{border-color:var(--primary-color);box-shadow:inset 0 0 0 1px var(--primary-color);
      background:color-mix(in srgb, var(--primary-color) 7%, transparent)}
    .modes .titre{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:14.5px;font-weight:600;color:var(--primary-text-color)}
    .modes em{font-style:normal;font-size:12px;font-weight:600;padding:1px 7px;border-radius:9px;
      background:color-mix(in srgb, var(--primary-color) 14%, transparent);color:var(--primary-color)}
    .modes .rond{width:14px;height:14px;border-radius:50%;box-sizing:border-box;border:2px solid var(--secondary-text-color);flex:none}
    .modes .choisi .rond{border:4px solid var(--primary-color)}
    .modes .description{font-size:12.5px;line-height:1.35;color:var(--secondary-text-color)}

    .tuiles{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
    .tuile{display:flex;align-items:center;gap:8px;min-height:58px;padding:0 4px 0 6px;border-radius:12px;box-sizing:border-box;
      background:var(--card-background-color, #fff);border:1px solid var(--divider-color);min-width:0}
    .tuile.propose{border-style:dashed;background:transparent;padding-left:10px}
    .tuile.etiquette{padding-left:10px}
    .tuile.sortable-ghost{opacity:.4}
    .poignee{display:grid;place-items:center;width:20px;height:40px;border-radius:6px;cursor:grab;color:var(--secondary-text-color);flex:none}
    .poignee ha-icon{--mdc-icon-size:18px}
    .icone{display:grid;place-items:center;width:34px;height:34px;border-radius:50%;flex:none;
      background:color-mix(in srgb, var(--primary-color) 12%, transparent);color:var(--primary-color)}
    .propose .icone{background:var(--secondary-background-color);color:var(--secondary-text-color)}
    .nom{flex:1;min-width:0;font-size:13.5px;font-weight:600;line-height:1.25;color:var(--primary-text-color)}
    .libelle{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .propose .nom{color:var(--secondary-text-color)}
    .nom small{display:block;font-size:11.5px;font-weight:500;color:var(--secondary-text-color);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .rond-bouton{display:grid;place-items:center;width:32px;height:32px;border-radius:50%;flex:none;color:var(--secondary-text-color)}
    .rond-bouton:hover{background:var(--secondary-background-color);color:var(--primary-text-color)}
    .rond-bouton ha-icon{--mdc-icon-size:18px}

    .interrupteur{display:flex;align-items:flex-start;gap:12px;margin-top:6px;font-size:14px;color:var(--primary-text-color);cursor:pointer}
    .interrupteur ha-switch{flex:none;margin-top:1px}
    .interrupteur small{display:block;margin-top:2px;font-size:12.5px;color:var(--secondary-text-color)}

    .puces{display:flex;flex-wrap:wrap;gap:8px}
    .puce{display:inline-flex;align-items:center;gap:6px;height:36px;padding:0 2px 0 10px;border-radius:18px;font-size:13.5px;
      background:var(--secondary-background-color);color:var(--primary-text-color)}
    .puce ha-state-icon{--mdc-icon-size:18px;color:var(--secondary-text-color)}
    .puce .rond-bouton{width:30px;height:30px}

    .renomme{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:12px}

    .pieces{flex-direction:row;align-items:center;justify-content:space-between;gap:16px}
    .lien{display:inline-flex;align-items:center;gap:6px;flex:none;padding:8px 14px;border-radius:18px;font-size:14px;font-weight:600;
      color:var(--primary-color);border:1px solid color-mix(in srgb, var(--primary-color) 40%, transparent)}
    .lien:hover{background:color-mix(in srgb, var(--primary-color) 8%, transparent)}
    .lien:disabled{opacity:.45;cursor:default;background:none}
    .lien ha-icon{--mdc-icon-size:18px}
    .ajout{display:block;align-self:flex-start}
    .actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:4px}
    a.lien{text-decoration:none}
    .retour{margin:0;font-size:13px;color:var(--secondary-text-color)}

    .haut{display:flex;align-items:center;gap:4px;flex:none}

    @container (max-width: 620px){
      .modes{grid-template-columns:repeat(2,minmax(0,1fr))}
      .tuiles{grid-template-columns:repeat(2,minmax(0,1fr))}
      .pieces{flex-direction:column;align-items:flex-start}
    }
    /* Téléphone : des tuiles verticales, comme celles du tableau, pour lire le nom en entier. */
    @container (max-width: 460px){
      .tuile{display:grid;grid-template-columns:1fr auto;grid-template-areas:"haut bouton" "nom nom";align-items:start;align-content:start;
        gap:6px 4px;padding:8px 4px 10px 8px;min-height:0}
      .tuile.propose{padding-left:10px}
      .haut{grid-area:haut}
      .tuile > .rond-bouton{grid-area:bouton}
      .nom{grid-area:nom;padding-left:2px}
      .libelle{white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
      .nom small{white-space:nowrap}
    }
    @media (prefers-reduced-motion: reduce){.modes button{transition:none}}
  `;
}
