// « Mes favoris » : chaque personne choisit les siens, sans droits d'administration. Ils sont
// gardés dans son compte Home Assistant et remplacent, pour elle seulement, les favoris
// épinglés du tableau. L'ordre est celui des flèches.

import { css, html, nothing, type PropertyDeclarations, type TemplateResult } from "lit";
import { ecrireFavorisPerso, lireFavorisPerso } from "../donnees/favoris";
import type { HomeAssistant } from "../ha";
import type { Entite, Maison } from "../moteur/types";
import { deplacer } from "../editeur/reglages";
import { naviguer, nomCourt, t } from "../outils";
import { CarteAutomatic, type OptionsGrille } from "./base";
import { STYLE_COMMUN } from "./styles";

export class AutomaticMesFavoris extends CarteAutomatic {
  static override properties: PropertyDeclarations = { _favoris: { state: true } };
  /** null tant que les favoris de la personne ne sont pas lus. */
  private declare _favoris: string[] | null;
  private _demande = false;

  constructor() {
    super();
    this._favoris = null;
  }

  static override styles = [STYLE_COMMUN, css`
    ha-card{padding:16px 20px 18px;display:grid;gap:18px}
    h2{margin:0;font-size:16px;font-weight:650;color:var(--primary-text-color)}
    .aide{margin:4px 0 0;font-size:13.5px;color:var(--secondary-text-color)}
    ol{list-style:none;margin:0;padding:0;display:grid;gap:6px}
    .ligne{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px;min-height:46px;padding:4px 6px 4px 10px;border-radius:12px;
      background:var(--secondary-background-color)}
    .ligne ha-state-icon{--mdc-icon-size:20px;color:var(--secondary-text-color)}
    .nom{font-size:14px;font-weight:600;color:var(--primary-text-color)}
    .nom small{display:block;font-size:12px;font-weight:500;color:var(--secondary-text-color)}
    .boutons{display:flex;gap:2px}
    .rond{display:grid;place-items:center;width:34px;height:34px;border-radius:50%;color:var(--secondary-text-color)}
    .rond:hover{background:var(--card-background-color, #fff);color:var(--primary-text-color)}
    .rond:disabled{opacity:.3;cursor:default}
    .rond ha-icon{--mdc-icon-size:19px}
    .piece{font-size:11.5px;font-weight:650;letter-spacing:.08em;text-transform:uppercase;color:var(--secondary-text-color);margin:6px 0 2px}
    .choix{display:flex;flex-wrap:wrap;gap:6px}
    .choix button{display:inline-flex;align-items:center;gap:7px;min-height:36px;padding:0 13px 0 9px;border-radius:18px;font-size:13.5px;
      background:var(--secondary-background-color);color:var(--primary-text-color)}
    .choix button.pris{background:color-mix(in srgb, var(--primary-color) 16%, transparent);color:var(--primary-color);font-weight:600}
    .choix ha-icon{--mdc-icon-size:17px}
    .bas{display:flex;flex-wrap:wrap;gap:10px;justify-content:space-between;align-items:center;padding-top:6px;border-top:1px solid var(--divider-color)}
    .lien{font-size:13.5px;font-weight:600;color:var(--secondary-text-color)}
    .fini{display:inline-flex;align-items:center;gap:6px;height:40px;padding:0 18px;border-radius:20px;font-size:14px;font-weight:650;
      background:var(--primary-color);color:var(--text-primary-color, #fff)}
  `];

  getGridOptions(): OptionsGrille {
    return { columns: "full", rows: "auto" };
  }

  protected override rendu(hass: HomeAssistant, m: Maison): TemplateResult {
    const tx = t(hass);
    if (!this._demande) {
      this._demande = true;
      lireFavorisPerso(hass).then((ids) => (this._favoris = ids));
    }
    if (this._favoris === null) return html`<ha-card><span class="attente" style="height:120px"></span></ha-card>`;
    const mes = this._favoris.filter((id) => hass.states[id]);
    // Ce qu'on peut mettre en favori : les commandes de chaque pièce, puis celles sans pièce.
    const candidats = m.gardees.filter((e) => e.role === "commande" && !e.secondaire || e.domaine === "scene" || e.domaine === "script");
    const parPiece = [...m.pieces.map((p): [string, Entite[]] => [p.name, candidats.filter((e) => e.piece === p.area_id)]),
      [tx.sansPieceTitre, candidats.filter((e) => !e.piece)] as [string, Entite[]]].filter(([, l]) => l.length);
    const piece = (id: string) => m.pieces.find((p) => p.area_id === m.toutes.find((e) => e.id === id)?.piece)?.name ?? "";
    return html`<ha-card>
      <div><h2>${tx.mesFavorisListe}</h2>
        <p class="aide">${mes.length ? tx.mesFavorisOrdre : tx.mesFavorisVide}</p></div>
      ${mes.length ? html`<ol>${mes.map((id, i) => html`<li class="ligne">
        <ha-state-icon .hass=${hass} .stateObj=${hass.states[id]}></ha-state-icon>
        <span class="nom">${nomCourt(hass, id, m.noms)}<small>${piece(id)}</small></span>
        <span class="boutons">
          <button class="rond" ?disabled=${i === 0} title=${tx.monter} aria-label=${tx.monter} @click=${() => this.enregistrer(deplacer(mes, i, i - 1))}><ha-icon icon="mdi:arrow-up"></ha-icon></button>
          <button class="rond" ?disabled=${i === mes.length - 1} title=${tx.descendre} aria-label=${tx.descendre} @click=${() => this.enregistrer(deplacer(mes, i, i + 1))}><ha-icon icon="mdi:arrow-down"></ha-icon></button>
          <button class="rond" title=${tx.retirerFavori} aria-label=${tx.retirerFavori} @click=${() => this.enregistrer(mes.filter((x) => x !== id))}><ha-icon icon="mdi:close"></ha-icon></button>
        </span></li>`)}</ol>` : nothing}
      <div>${parPiece.map(([nom, liste]) => html`<div class="piece">${nom}</div><div class="choix">${liste.map((e) => {
        const pris = mes.includes(e.id);
        return html`<button class=${pris ? "pris" : ""} aria-pressed=${pris ? "true" : "false"}
          @click=${() => this.enregistrer(pris ? mes.filter((x) => x !== e.id) : [...mes, e.id])}>
          <ha-icon icon=${pris ? "mdi:star" : "mdi:star-outline"}></ha-icon>${nomCourt(hass, e.id, m.noms)}</button>`;
      })}</div>`)}</div>
      <div class="bas">
        ${mes.length ? html`<button class="lien" @click=${() => this.enregistrer([])}>${tx.favorisDuTableau}</button>` : html`<span></span>`}
        <button class="fini" @click=${this.terminer}>${tx.termine}</button>
      </div>
    </ha-card>`;
  }

  private async enregistrer(ids: string[]): Promise<void> {
    this._favoris = ids;
    await ecrireFavorisPerso(this.hass!, ids);
  }

  // Retour à l'accueil, reconstruit avec les nouveaux favoris.
  private terminer = (): void => {
    naviguer("accueil");
    window.setTimeout(() => location.reload(), 50);
  };
}
