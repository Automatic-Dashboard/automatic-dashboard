// Les aperçus : un sujet, un chiffre, une tendance (climat, énergie, humidité,
// éphéméride, appareils à ranger).

import { css, html, nothing, type PropertyDeclarations, type TemplateResult } from "lit";
import { historique, type Serie } from "../donnees/historique";
import type { HomeAssistant } from "../ha";
import { courbe } from "../mise-en-page/courbes";
import type { Maison } from "../moteur/types";
import { enMarcheClimat, moyenneInterieure, temperatureDehors } from "../moteur/valeurs";
import { degres, heure, langue, naviguer, nombre, phaseLune, plusDInfos, t, valide } from "../outils";
import { CarteAutomatic, definis, type OptionsGrille } from "./base";
import { STYLE_COMMUN } from "./styles";

export class AutomaticApercu extends CarteAutomatic {
  static override properties: PropertyDeclarations = {
    _courbe: { state: true },
  };

  static override styles = [STYLE_COMMUN, css`
    button.carte{display:flex;flex-direction:column;justify-content:space-between;width:100%;height:100%;padding:13px 15px 12px;border-radius:var(--ha-card-border-radius)}
    .valeur{font-size:25px;font-weight:650;letter-spacing:-.02em;line-height:1.1;color:var(--primary-text-color);margin-top:4px}
    .valeur small{font-size:14px;font-weight:600;color:var(--secondary-text-color);margin-left:3px}
    .detail{font-size:12.5px;line-height:1.35}
    .detail{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}
    .bas{display:block;margin:0 -15px -12px}
    .courbe{height:30px}
    .lignes{display:grid;gap:7px;margin-top:6px}
    .ligne{display:flex;align-items:center;gap:9px;font-size:14px;font-weight:550;color:var(--primary-text-color)}
    .ligne ha-icon{--mdc-icon-size:18px;color:var(--secondary-text-color)}
    .ligne .doux{font-weight:500}
    .tete{display:flex;align-items:center;justify-content:space-between}
    .tete ha-icon{--mdc-icon-size:18px;color:var(--secondary-text-color)}
    @container (max-width: 150px){ .bas{display:none} }
  `];

  /** L'historique de 24 h de la mini-courbe, quand il est arrivé. */
  private declare _courbe?: Serie;
  /** Le sujet dont l'historique a déjà été demandé. */
  private _demande?: string;

  getGridOptions(): OptionsGrille {
    return { columns: 6, rows: 2, min_columns: 4, max_columns: 12, min_rows: 2, max_rows: 2 };
  }

  override suivies(m: Maison): string[] {
    const s = this._config?.sorte;
    if (s === "climat") return definis([...m.temperaturesInterieures.flat(), m.meteo]);
    if (s === "energie") return definis([m.puissanceReseau]);
    if (s === "ephemeride") return definis(["sun.sun", m.ferie, m.lune]);
    if (s === "humidite") return m.pieces.flatMap((p) => p.humidites);
    return [];
  }

  protected override rendu(hass: HomeAssistant, m: Maison): TemplateResult | null {
    const tx = t(hass);
    const s = this._config?.sorte;
    const etat = (id: string | null | undefined) => (id ? hass.states[id] : undefined);
    if (s === "climat") {
      const d = moyenneInterieure(hass, m);
      if (d === null) return null;
      const e = temperatureDehors(hass, m);
      const enMarche = enMarcheClimat(hass, m);
      this.chargerCourbe("climat", m.temperaturesInterieures.map((c) => c[0]).slice(0, 8));
      return this.gabarit("mdi:home-thermometer-outline", tx.climat, html`${nombre(hass, d, 1)}<small>° ${tx.dedans}</small>`,
        [e !== null ? `${tx.dehors} ${degres(hass, e)}` : "", enMarche]
          .filter(Boolean).join(" · "));
    }
    if (s === "energie") {
      const ent = etat(m.puissanceReseau);
      const w = Number.parseFloat(ent?.state ?? "");
      if (Number.isNaN(w)) return null;
      this.chargerCourbe("energie", [m.puissanceReseau]);
      return this.gabarit("mdi:lightning-bolt-outline", tx.energie,
        html`${nombre(hass, w, 0)}<small>${ent!.attributes.unit_of_measurement || "W"}</small>`, tx.enCeMoment);
    }
    if (s === "humidite") {
      const ids = m.pieces.filter((p) => !p.exterieur && !p.annexe && p.humidites.length).map((p) => p.humidites[0]);
      const valeurs = ids.map((id) => Number.parseFloat(etat(id)?.state ?? "")).filter((v) => !Number.isNaN(v));
      if (!valeurs.length) return null;
      const h = valeurs.reduce((a, b) => a + b, 0) / valeurs.length;
      this.chargerCourbe("humidite", ids.slice(0, 8));
      const tx = t(hass);
      const avis = h < 35 ? tx.airSec : h > 65 ? tx.airHumide : tx.confortable;
      return this.gabarit("mdi:water-percent", tx.humiditeTitre, html`${nombre(hass, h, 0)}<small>%</small>`, avis);
    }
    if (s === "a-ranger") {
      if (!m.aRanger.length) return null;
      const noms = m.aRanger.slice(0, 3).map((e) => m.noms[e.id] || e.etat.attributes.friendly_name).join(", ");
      return this.gabarit("mdi:tray-arrow-down", tx.aRanger, tx.sansPiece(m.aRanger.length), `${noms} · ${tx.choisirPieces} ›`);
    }
    if (s === "ephemeride") {
      const soleil = etat("sun.sun");
      const lignes: TemplateResult[] = [];
      if (soleil) {
        const lever = new Date(soleil.attributes.next_rising), coucher = new Date(soleil.attributes.next_setting);
        let duree = (coucher.getTime() - lever.getTime()) / 60000;
        if (duree < 0) duree += 1440;
        lignes.push(html`<div class="ligne"><ha-icon icon="mdi:weather-sunset-up"></ha-icon>${heure(hass, lever)}
          <ha-icon icon="mdi:weather-sunset-down"></ha-icon>${heure(hass, coucher)}
          <span class="doux">· ${Math.floor(duree / 60)} h ${String(Math.round(duree % 60)).padStart(2, "0")} ${tx.deJour}</span></div>`);
      }
      const ferie = etat(m.ferie);
      if (ferie?.attributes.message) {
        const jours = Math.round((new Date(ferie.attributes.start_time).getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000);
        lignes.push(html`<div class="ligne"><ha-icon icon="mdi:calendar-star"></ha-icon>${ferie.state === "on" ? tx.ferieAujourdhui : ferie.attributes.message}
          <span class="doux">· ${ferie.state === "on" ? ferie.attributes.message : tx.dansJours(jours)}</span></div>`);
      }
      const lune = etat(m.lune);
      if (valide(lune)) {
        lignes.push(html`<div class="ligne"><ha-icon icon="mdi:moon-waxing-crescent"></ha-icon>${hass.formatEntityState?.(lune) || lune.state}</div>`);
      } else {
        const l = phaseLune(new Date(), langue(hass));
        lignes.push(html`<div class="ligne"><ha-icon icon=${l.icone}></ha-icon>${l.nom}<span class="doux">· ${l.pleine}</span></div>`);
      }
      if (!lignes.length) return null;
      return html`<ha-card><button class="carte" data-entite="sun.sun" @click=${this._clic}><span class="tete"><span class="sur">${tx.aujourdhui}</span>
        <ha-icon icon="mdi:white-balance-sunny"></ha-icon></span><span class="lignes">${lignes}</span></button></ha-card>`;
    }
    return null;
  }

  private gabarit(icone: string, sur: string, valeur: TemplateResult | string, detail: string): TemplateResult {
    const valeurs = this._courbe ?? [];
    return html`<ha-card><button class="carte" @click=${this._clic}><span class="tete"><span class="sur">${sur}</span><ha-icon icon=${icone}></ha-icon></span>
      <span><span class="valeur chiffre">${valeur}</span><span class="detail doux" style="display:block">${detail}</span></span>
      ${valeurs.length ? html`<span class="bas">${courbe(valeurs, 200, 30)}</span>`
        : this._demande && this._courbe === undefined ? html`<span class="bas" aria-busy="true"><span class="attente" style="height:22px;margin:0 15px 8px"></span></span>` : nothing}
      </button></ha-card>`;
  }

  // Une seule demande par carte : l'historique arrive plus tard et redessine la carte.
  private chargerCourbe(cle: string, ids: (string | null | undefined)[]): void {
    const utiles = definis(ids);
    if (this._demande === cle || !utiles.length) return;
    this._demande = cle;
    historique(this.hass!, cle, utiles).then((valeurs) => {
      this._courbe = valeurs;
    });
  }

  private _clic(): void {
    const s = this._config?.sorte;
    if (!s) return;
    if (s === "ephemeride") plusDInfos(this, "sun.sun");
    else naviguer(s === "humidite" ? "climat" : s);
  }
}
