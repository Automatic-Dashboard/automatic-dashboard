// L'ouverture de page : le texte de tête, posé sur le fond (pas de carte) :
// surtitre, titre, phrase.

import { css, html, nothing, type TemplateResult } from "lit";
import { styleMap } from "lit/directives/style-map.js";
import type { HomeAssistant } from "../ha";
import type { Maison } from "../moteur/types";
import { phraseAccueil, phraseAir, phraseMeteo, phrasePiece, phraseSujet, phraseVehicule } from "../phrases";
import { estFrancais, langue, majuscule, t } from "../outils";
import { CarteAutomatic, definis } from "./base";
import { ciel, STYLE_CIEL } from "./ciel";
import { STYLE_COMMUN } from "./styles";

export class AutomaticOuverture extends CarteAutomatic {
  static override styles = [STYLE_COMMUN, STYLE_CIEL, css`
    :host{display:block}
    .bloc{padding:6px 2px 4px}
    .sur{display:inline-flex;align-items:center;gap:8px;color:var(--accent-color)}
    .sur::before{content:"";width:8px;height:8px;border-radius:2px;background:var(--primary-color)}
    h1{margin:10px 0 6px;font-family:var(--ha-font-family-heading, Inter, sans-serif);font-size:34px;line-height:1.08;font-weight:700;letter-spacing:-.025em;color:var(--primary-text-color)}
    .phrase{display:flex;align-items:baseline;gap:9px;font-size:16.5px;line-height:1.4;color:var(--primary-text-color);max-width:62ch}
    .phrase::before{content:"";flex:none;width:9px;height:9px;border-radius:50%;transform:translateY(-1px);background:var(--point, var(--automatic-dashboard-vert, var(--success-color, #1E6B47)))}
    @container (max-width: 420px){ h1{font-size:28px} .phrase{font-size:15.5px} }
    .tete{display:flex;align-items:flex-end;justify-content:space-between;gap:20px}
    .tete .bloc{flex:1;min-width:0}
    /* Le ciel passe sous la phrase, en bandeau aligné sur le texte, la légende à droite. */
    .tete{flex-direction:column;align-items:stretch;gap:4px}
    .tete .ciel{display:grid;grid-template-columns:minmax(0,520px) auto;justify-content:start;align-items:end;gap:14px;margin-top:2px}
    .tete .ciel .rond{display:none}
    .tete .ciel .bandeau{display:block;max-height:58px}
    @container (max-width: 560px){ .tete .ciel{grid-template-columns:1fr auto;gap:10px} .tete .ciel figcaption{font-size:11px} }
  `];

  /** L'heure du dernier rendu : la salutation change avec elle. */
  private _heure = -1;

  override suivies(m: Maison): string[] {
    return definis(["sun.sun", ...m.personnes, ...m.securite.map((e) => e.id), m.meteo, m.meteoFrance, m.vigilance, ...m.alertes.map((e) => e.id), ...m.ouvrants.map((e) => e.id), ...m.piles.map((e) => e.id),
      ...m.majs.map((e) => e.id), ...m.systeme.map((e) => e.id), ...m.temperaturesInterieures.flat(), m.puissanceReseau,
      ...m.pieces.flatMap((p) => p.entites.map((e) => e.id))]);
  }

  protected override autresChangements(): boolean {
    return new Date().getHours() !== this._heure;
  }

  protected override rendu(hass: HomeAssistant, m: Maison): TemplateResult {
    const tx = t(hass);
    const page = this._config?.page || "accueil";
    const maintenant = new Date();
    this._heure = maintenant.getHours();
    const date = majuscule(new Intl.DateTimeFormat(langue(hass), { weekday: "long", day: "numeric", month: "long" }).format(maintenant));
    let sur = `${date} · ${hass.config.location_name || ""}`;
    let titre = "", phrase = "", point = "var(--automatic-dashboard-vert, var(--success-color, #1E6B47))";

    if (page === "accueil") {
      const h = this._heure;
      const prenom = (hass.user?.name || "").replace(/\s*\(.*\)\s*$/, "").split(" ")[0];
      titre = `${h < 5 ? tx.nuit : h < 12 ? tx.bonjour : h < 18 ? tx.apresmidi : tx.bonsoir}${prenom ? `, ${prenom}` : ""}`;
      ({ phrase, point } = phraseAccueil(hass, m));
    } else if (page === "air" || page === "vehicule" || page === "exterieur") {
      titre = { air: tx.air, vehicule: tx.vehicule, exterieur: tx.exterieur }[page];
      sur = date;
      ({ phrase, point } = page === "air" ? phraseAir(hass, m) : page === "vehicule" ? phraseVehicule(hass, m) : phraseMeteo(hass, m));
    } else if (page === "mes-favoris") {
      titre = tx.mesFavoris;
      sur = date;
      phrase = tx.mesFavorisPhrase;
      point = "var(--primary-color)";
    } else if (page === "depart") {
      titre = tx.jePars;
      sur = date;
      phrase = tx.departPhrase;
      point = "var(--primary-color)";
    } else if (page === "bilan") {
      titre = tx.bilan;
      sur = date;
      phrase = tx.bilanEntete;
      point = "var(--primary-color)";
    } else if (this._config?.piece) {
      const p = m.pieces.find((x) => x.area_id === this._config?.piece);
      titre = p?.name || "";
      sur = [tx.pieceSurtitre, p?.floor_id ? hass.floors?.[p.floor_id]?.name : undefined].filter(Boolean).join(" · ");
      phrase = p ? phrasePiece(hass, p).phrase : "";
      point = "var(--primary-color)";
    } else {
      const n = m.aRanger.length;
      const titres: Record<string, string> = {
        climat: tx.climat, energie: tx.energie, securite: tx.securite, systeme: tx.systeme,
        "a-ranger": estFrancais(hass) ? `${n} appareil${n > 1 ? "s n'ont" : " n'a"} pas de pièce` : tx.sansPiece(n),
      };
      titre = titres[page] || "";
      sur = date;
      ({ phrase, point } = phraseSujet(hass, m, page));
    }
    const bloc = html`<div class="bloc" style=${styleMap({ "--point": point })}><div class="sur">${sur}</div><h1>${titre}</h1>
      ${phrase ? html`<div class="phrase">${phrase}</div>` : nothing}</div>`;
    // L'accueil porte le ciel du jour, à droite du texte : la disposition ne change pas, le ciel tourne.
    return page === "accueil" && m.reglages.ciel !== false ? html`<div class="tete">${bloc}${ciel(hass, maintenant)}</div>` : bloc;
  }
}
