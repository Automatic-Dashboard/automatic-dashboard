// Les pastilles : badges de vue, l'état en une ligne qui défile, et la navigation.

import { css, html, nothing, type TemplateResult } from "lit";
import type { HomeAssistant } from "../ha";
import type { Maison } from "../moteur/types";
import { moyenneInterieure, premiereValeur } from "../moteur/valeurs";
import { conditionMeteo, degres, heure, naviguer, nombre, plusDInfos, t, valide } from "../outils";
import { CarteCentralHome, definis } from "./base";
import { STYLE_COMMUN } from "./styles";

export class CentralHomePastille extends CarteCentralHome {
  static override styles = [STYLE_COMMUN, css`
    :host{display:inline-block;height:auto;container-type:normal}
    button{display:inline-flex;align-items:center;gap:7px;height:36px;padding:0 13px 0 10px;border-radius:999px;white-space:nowrap;
      background:var(--ha-card-background);border:1px solid var(--divider-color);font-size:14px;font-weight:600;color:var(--primary-text-color)}
    button:hover{border-color:var(--primary-color)}
    ha-icon{--mdc-icon-size:18px;color:var(--secondary-text-color)}
    .valeur{font-weight:500;color:var(--secondary-text-color)}
    .actif{background:var(--centralhome-accent-pale)} .actif ha-icon{color:var(--state-light-active-color)}
    .attention{background:rgba(233,162,59,.14)} .attention ha-icon{color:var(--warning-color)}
    .alerte{background:var(--centralhome-alerte-pale)} .alerte ha-icon{color:var(--centralhome-alerte)}
  `];

  override suivies(m: Maison): string[] {
    const s = this._config?.sujet;
    if (s === "meteo") return definis([m.meteo]);
    if (s === "climat") return m.temperaturesInterieures.flat();
    if (s === "lumieres") return m.lumieres.map((e) => e.id);
    if (s === "securite") return [...m.ouvrants, ...m.alertes].map((e) => e.id);
    if (s === "energie") return definis([m.puissanceReseau]);
    if (s === "systeme") return m.majs.map((e) => e.id);
    if (s === "soleil") return ["sun.sun"];
    if (s === "piece") return m.pieces.find((p) => p.area_id === this._config?.piece)?.temperatures ?? [];
    return [];
  }

  protected override rendu(hass: HomeAssistant, m: Maison): TemplateResult | null {
    const tx = t(hass);
    const s = this._config?.sujet;
    const etat = (id: string | null | undefined) => (id ? hass.states[id] : undefined);
    let icone = "mdi:circle-small", libelle = "", valeur = "", ton = "";
    if (s === "meteo") {
      const w = etat(m.meteo);
      if (!valide(w)) return null;
      ({ icone } = conditionMeteo(hass, w));
      libelle = degres(hass, w.attributes.temperature); valeur = conditionMeteo(hass, w).texte;
    } else if (s === "climat") {
      const d = moyenneInterieure(hass, m);
      if (d === null) return null;
      icone = "mdi:home-thermometer-outline"; libelle = degres(hass, d); valeur = tx.dedans;
    } else if (s === "lumieres") {
      const n = m.lumieres.filter((e) => etat(e.id)?.state === "on").length;
      icone = "mdi:lightbulb-group-outline"; libelle = tx.lumieres; valeur = tx.allumees(n); ton = n ? "actif" : "";
    } else if (s === "securite") {
      const ouverts = m.ouvrants.filter((e) => etat(e.id)?.state === "on").length;
      const alertes = m.alertes.filter((e) => etat(e.id)?.state === "on").length;
      icone = alertes ? "mdi:shield-alert-outline" : "mdi:shield-home-outline"; libelle = tx.securite;
      valeur = alertes ? tx.fuite : ouverts ? tx.ouverts(ouverts) : tx.toutFerme; ton = alertes ? "alerte" : ouverts ? "attention" : "";
    } else if (s === "energie") {
      const reseau = etat(m.puissanceReseau);
      const w = Number.parseFloat(reseau?.state ?? "");
      if (Number.isNaN(w)) return null;
      icone = "mdi:lightning-bolt-outline"; libelle = `${nombre(hass, w, 0)} ${reseau!.attributes.unit_of_measurement || "W"}`; valeur = tx.enCeMoment;
    } else if (s === "systeme") {
      const n = m.majs.filter((e) => etat(e.id)?.state === "on").length;
      icone = "mdi:server-outline"; libelle = tx.systeme; valeur = n ? tx.majs(n) : tx.aJour; ton = n ? "attention" : "";
    } else if (s === "a-ranger") {
      if (!m.aRanger.length) return null;
      icone = "mdi:tray-arrow-down"; libelle = tx.aRanger; valeur = String(m.aRanger.length);
    } else if (s === "piece") {
      const p = m.pieces.find((x) => x.area_id === this._config?.piece);
      if (!p) return null;
      const v = premiereValeur(hass, p.temperatures);
      icone = p.icon; libelle = p.name; valeur = v !== null ? degres(hass, v) : "";
    } else if (s === "soleil") {
      const soleil = etat("sun.sun");
      if (!soleil) return null;
      const leve = soleil.state === "above_horizon";
      icone = leve ? "mdi:weather-sunset-down" : "mdi:weather-sunset-up";
      libelle = leve ? tx.coucher : tx.lever;
      valeur = heure(hass, new Date(leve ? soleil.attributes.next_setting : soleil.attributes.next_rising));
    }
    return html`<button class=${ton} @click=${this._clic}><ha-icon icon=${icone}></ha-icon>${libelle}${valeur ? html`<span class="valeur">${valeur}</span>` : nothing}</button>`;
  }

  private _clic(): void {
    const s = this._config?.sujet;
    if (!s) return;
    if (s === "meteo") { const meteo = this.maison.meteo; if (meteo) plusDInfos(this, meteo); }
    else if (s === "soleil") plusDInfos(this, "sun.sun");
    else if (s === "lumieres") { if (this.hass?.panels?.light) naviguer("/light"); }
    else if (s === "piece") naviguer(this._config?.piece ?? "");
    else naviguer(s);
  }
}
