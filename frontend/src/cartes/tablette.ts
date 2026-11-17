// Le mode tablette murale : une page à part (/<tableau>/tablette), lisible de loin. L'heure
// en grand, la date, la phrase d'état, le ciel du jour et trois chiffres ; à droite, les
// points à regarder ; en bas, les favoris en grands boutons. Un bouton passe en plein écran
// (sans l'en-tête ni le menu de Home Assistant ; un appui long sur l'heure en sort). La nuit
// (heures réglables), sans toucher l'écran pendant une minute, un écran de veille noir garde
// l'heure, faible, et la déplace un peu chaque minute ; un geste, ou un détecteur de présence
// choisi dans les réglages, le rallume.

import { css, html, nothing, type PropertyDeclarations, type TemplateResult } from "lit";
import { favorisDeLaPersonne } from "../strategie/accueil";
import type { HomeAssistant } from "../ha";
import { pointsVisibles } from "../moteur/points";
import type { Maison } from "../moteur/types";
import { moyenneInterieure, temperatureDehors } from "../moteur/valeurs";
import { phraseAccueil } from "../phrases";
import { conditionMeteo, degres, douzeHeures, langue, majuscule, nombre, nomCourt, plusDInfos, t } from "../outils";
import { CarteAutomatic, definis, type OptionsGrille } from "./base";
import { ciel, STYLE_CIEL } from "./ciel";
import { STYLE_COMMUN } from "./styles";

/** La nuit de l'écran de veille : de 23 h à 6 h par défaut, ou les heures choisies (elle peut ne pas passer minuit). */
export const estNuit = (d: Date, debut = 23, fin = 6): boolean => {
  const h = d.getHours();
  if (debut === fin) return false;
  return debut > fin ? h >= debut || h < fin : h >= debut && h < fin;
};
const VEILLE_APRES = 60000;
const KIOSQUE = "automatic_dashboard_kiosque";
const BASCULE = new Set(["light", "switch", "fan", "input_boolean", "cover", "siren"]);

/** Cherche un élément dans tous les arbres fantômes. */
function trouver(racine: Document | ShadowRoot, selecteur: string): Element | null {
  const trouve = racine.querySelector(selecteur);
  if (trouve) return trouve;
  for (const el of racine.querySelectorAll("*")) {
    if (el.shadowRoot) {
      const x = trouver(el.shadowRoot, selecteur);
      if (x) return x;
    }
  }
  return null;
}

export class AutomaticTablette extends CarteAutomatic {
  static override properties: PropertyDeclarations = {
    _veille: { state: true }, _minute: { state: true }, _favoris: { state: true }, _kiosque: { state: true },
  };
  private declare _veille: boolean;
  private declare _minute: number;
  private declare _favoris: string[];
  private declare _kiosque: boolean;
  private _horloge?: number;
  private _dernierGeste = Date.now();
  private _appuiHeure?: number;
  private _demandeFavoris = false;

  constructor() {
    super();
    this._veille = false;
    this._minute = -1;
    this._favoris = [];
    this._kiosque = localStorage.getItem(KIOSQUE) === "1";
  }

  private get reglagesTablette() {
    const r = (this._config?.reglages ?? {}).tablette ?? {};
    return { debut: r.debut_nuit ?? 23, fin: r.fin_nuit ?? 6, reveil: r.reveil };
  }

  // Le plein écran : l'en-tête et le menu de Home Assistant disparaissent sur cet appareil.
  private appliquerKiosque(oui: boolean): void {
    const racine = trouver(document, "hui-root")?.shadowRoot;
    const style = racine?.getElementById("automatic-dashboard-kiosque");
    if (oui && racine && !style) {
      const s = document.createElement("style");
      s.id = "automatic-dashboard-kiosque";
      s.textContent = ".header{display:none!important}#view{padding-top:0!important;min-height:100vh}";
      racine.appendChild(s);
    } else if (!oui) style?.remove();
    this.dispatchEvent(new CustomEvent("hass-dock-sidebar", { detail: { dock: oui ? "always_hidden" : "docked" }, bubbles: true, composed: true }));
  }

  private basculerKiosque(oui: boolean): void {
    this._kiosque = oui;
    localStorage.setItem(KIOSQUE, oui ? "1" : "0");
    this.appliquerKiosque(oui);
    if (oui) document.documentElement.requestFullscreen?.().catch(() => undefined);
    else if (document.fullscreenElement) document.exitFullscreen?.().catch(() => undefined);
  }

  private _echap = (ev: KeyboardEvent): void => {
    if (ev.key === "Escape" && this._kiosque) this.basculerKiosque(false);
  };

  static override styles = [STYLE_COMMUN, STYLE_CIEL, css`
    :host{height:100%}
    .ecran{position:relative;box-sizing:border-box;min-height:calc(100vh - var(--header-height, 56px) - 16px);display:grid;
      grid-template-columns:minmax(0,1.4fr) minmax(0,1fr);gap:clamp(20px,4vw,64px);padding:clamp(20px,4vw,56px);align-items:center}
    .heure{user-select:none;-webkit-user-select:none;cursor:default}
    .plein{position:absolute;top:14px;right:16px;display:inline-flex;align-items:center;gap:6px;height:36px;padding:0 14px 0 10px;border-radius:18px;
      font-size:13.5px;font-weight:600;color:var(--secondary-text-color);background:var(--secondary-background-color)}
    .plein ha-icon{--mdc-icon-size:20px}
    .commandes{grid-column:1 / -1;display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
    .commande{display:flex;align-items:center;gap:14px;min-height:72px;padding:12px 18px;border-radius:20px;font-size:17px;font-weight:650;
      color:var(--primary-text-color);background:var(--ha-card-background, var(--card-background-color));border:1px solid var(--divider-color)}
    .commande ha-state-icon{--mdc-icon-size:28px;color:var(--secondary-text-color)}
    .commande.actif{background:color-mix(in srgb, var(--state-light-active-color, #E9A23B) 16%, var(--ha-card-background, var(--card-background-color)))}
    .commande.actif ha-state-icon{color:var(--state-light-active-color, #E9A23B)}
    .commande span{text-align:left;line-height:1.2;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
    .heure{font-size:clamp(84px,14vw,200px);font-weight:700;letter-spacing:-.05em;line-height:.9;color:var(--primary-text-color);font-variant-numeric:tabular-nums}
    .date{margin-top:14px;font-size:clamp(20px,2.4vw,30px);font-weight:600;color:var(--secondary-text-color)}
    .phrase{display:flex;align-items:baseline;gap:14px;margin-top:clamp(20px,3vw,40px);font-size:clamp(20px,2.3vw,30px);line-height:1.35;
      color:var(--primary-text-color);max-width:28ch}
    .phrase::before{content:"";flex:none;width:14px;height:14px;border-radius:50%;background:var(--point);transform:translateY(-2px)}
    .chiffres{display:flex;flex-wrap:wrap;gap:clamp(18px,3vw,44px);margin-top:clamp(24px,3vw,44px)}
    .chiffre-tab{display:flex;flex-direction:column;gap:4px}
    .chiffre-tab b{font-size:clamp(28px,3.4vw,46px);font-weight:680;letter-spacing:-.02em;color:var(--primary-text-color);font-variant-numeric:tabular-nums}
    .chiffre-tab span{font-size:15px;font-weight:600;color:var(--secondary-text-color);display:flex;align-items:center;gap:6px}
    .chiffre-tab ha-icon{--mdc-icon-size:18px}
    .droite{display:grid;gap:18px;align-content:center}
    .ciel{align-self:start}
    .ciel .rond{width:min(100%,320px);height:auto}
    .ciel figcaption{font-size:14px}
    ul{list-style:none;margin:0;padding:0;display:grid;gap:10px}
    li button{display:grid;grid-template-columns:auto 1fr;gap:16px;align-items:center;width:100%;padding:16px 18px;border-radius:18px;
      background:var(--ha-card-background, var(--card-background-color));border:1px solid var(--divider-color)}
    li .ico{width:48px;height:48px;border-radius:14px}
    li .ico ha-icon{--mdc-icon-size:26px}
    .n3 .ico{background:var(--automatic-dashboard-alerte-pale, color-mix(in srgb, var(--error-color, #B42318) 12%, transparent));color:var(--automatic-dashboard-alerte, var(--error-color, #B42318))}
    .n2 .ico{background:rgba(233,162,59,.16);color:var(--warning-color)}
    .n1 .ico{background:var(--automatic-dashboard-accent-pale, color-mix(in srgb, var(--primary-color) 12%, transparent));color:var(--primary-color)}
    .titre{font-size:19px;font-weight:650;color:var(--primary-text-color);line-height:1.25}
    .titre small{display:block;font-size:15px;font-weight:500;color:var(--secondary-text-color);margin-top:3px}
    .calme{font-size:20px;color:var(--secondary-text-color);display:flex;align-items:center;gap:12px}
    .calme ha-icon{--mdc-icon-size:30px;color:var(--automatic-dashboard-vert, var(--success-color, #1E6B47))}
    .veille{position:fixed;inset:0;z-index:100;background:#000;cursor:none;display:block}
    .veille .heure{position:absolute;color:#fff;opacity:.32;font-size:clamp(64px,10vw,140px);transition:left 2s, top 2s}
    @container (max-width: 760px){ .ecran{grid-template-columns:1fr;align-items:start} }
    @media (prefers-reduced-motion: reduce){ .veille .heure{transition:none} }
  `];

  getGridOptions(): OptionsGrille {
    return { columns: "full", rows: "auto" };
  }

  override suivies(m: Maison): string[] {
    return definis(["sun.sun", m.meteo, m.puissanceReseau, ...m.personnes, ...m.temperaturesInterieures.flat(), ...m.securite.map((e) => e.id),
      ...m.alertes.map((e) => e.id), ...m.piles.map((e) => e.id), ...m.majs.map((e) => e.id), ...m.lumieres.map((e) => e.id)]);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    // Une horloge à la seconde près ; l'écran de veille se décide en même temps.
    this._horloge = window.setInterval(() => {
      const maintenant = new Date();
      if (maintenant.getMinutes() !== this._minute) this._minute = maintenant.getMinutes();
      const { debut, fin, reveil } = this.reglagesTablette;
      // Quelqu'un passe devant la tablette : le détecteur choisi la rallume, comme un geste.
      if (reveil && this.hass?.states[reveil]?.state === "on") this._dernierGeste = Date.now();
      const veille = estNuit(maintenant, debut, fin) && Date.now() - this._dernierGeste > VEILLE_APRES;
      if (veille !== this._veille) this._veille = veille;
    }, 1000);
    for (const geste of ["pointerdown", "keydown", "touchstart"]) window.addEventListener(geste, this._reveil, { capture: true });
    window.addEventListener("keydown", this._echap);
    // Le plein écran choisi sur cet appareil revient au chargement (la tablette reste sur cette page).
    if (this._kiosque) window.setTimeout(() => this.appliquerKiosque(true), 300);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.clearInterval(this._horloge);
    for (const geste of ["pointerdown", "keydown", "touchstart"]) window.removeEventListener(geste, this._reveil, { capture: true });
    window.removeEventListener("keydown", this._echap);
    // On quitte la page : Home Assistant retrouve son en-tête et son menu.
    if (this._kiosque) this.appliquerKiosque(false);
  }

  // Un geste réveille l'écran ; celui qui réveille ne déclenche rien d'autre.
  private _reveil = (ev: Event): void => {
    this._dernierGeste = Date.now();
    if (this._veille) {
      ev.preventDefault();
      ev.stopPropagation();
      this._veille = false;
    }
  };

  protected override rendu(hass: HomeAssistant, m: Maison): TemplateResult {
    const tx = t(hass);
    const maintenant = new Date();
    const heure = new Intl.DateTimeFormat(langue(hass), { hour: "2-digit", minute: "2-digit", hour12: douzeHeures(hass) }).format(maintenant);
    if (this._veille) {
      // La position change chaque minute, toujours dans l'écran.
      const graine = maintenant.getHours() * 60 + maintenant.getMinutes();
      const x = 8 + ((graine * 37) % 50);
      const y = 10 + ((graine * 53) % 60);
      return html`<div class="veille" role="button" aria-label=${tx.reveiller}><span class="heure" style=${`left:${x}%;top:${y}%`}>${heure}</span></div>`;
    }
    const date = majuscule(new Intl.DateTimeFormat(langue(hass), { weekday: "long", day: "numeric", month: "long" }).format(maintenant));
    const { phrase, point } = phraseAccueil(hass, m);
    const dedans = moyenneInterieure(hass, m);
    const dehors = temperatureDehors(hass, m);
    const meteo = m.meteo ? hass.states[m.meteo] : undefined;
    const puissance = m.puissanceReseau ? Number.parseFloat(hass.states[m.puissanceReseau]?.state ?? "") : Number.NaN;
    const points = pointsVisibles(hass, m).visibles.slice(0, 4);
    if (!this._demandeFavoris) {
      this._demandeFavoris = true;
      favorisDeLaPersonne(hass, m, m.reglages).then((ids) => (this._favoris = ids.slice(0, 6)));
    }
    const favoris = this._favoris.filter((id) => hass.states[id]);
    return html`<div class="ecran">
      ${this._kiosque ? nothing : html`<button class="plein" title=${tx.pleinEcran} @click=${() => this.basculerKiosque(true)}>
        <ha-icon icon="mdi:fullscreen"></ha-icon>${tx.pleinEcran}</button>`}
      <div>
        <div class="heure" title=${this._kiosque ? tx.sortirPleinEcran : ""}
          @pointerdown=${() => { this._appuiHeure = window.setTimeout(() => this.basculerKiosque(false), 1000); }}
          @pointerup=${() => window.clearTimeout(this._appuiHeure)} @pointerleave=${() => window.clearTimeout(this._appuiHeure)}>${heure}</div>
        <div class="date">${date}</div>
        <div class="phrase" style=${`--point:${point}`}>${phrase}</div>
        <div class="chiffres">
          ${dehors !== null ? html`<div class="chiffre-tab"><b>${degres(hass, dehors)}</b>
            <span><ha-icon icon=${conditionMeteo(hass, meteo).icone}></ha-icon>${tx.dehors}</span></div>` : nothing}
          ${dedans !== null ? html`<div class="chiffre-tab"><b>${degres(hass, dedans)}</b><span><ha-icon icon="mdi:home-thermometer-outline"></ha-icon>${majuscule(tx.dedans)}</span></div>` : nothing}
          ${!Number.isNaN(puissance) ? html`<div class="chiffre-tab"><b>${nombre(hass, puissance, 0)} W</b>
            <span><ha-icon icon="mdi:lightning-bolt-outline"></ha-icon>${tx.energie}</span></div>` : nothing}
        </div>
      </div>
      <div class="droite">
        ${ciel(hass, maintenant)}
        ${points.length
          ? html`<ul>${points.map((p) => html`<li class="n${p.niveau}"><button @click=${() => p.entite && plusDInfos(this, p.entite)}>
              <span class="ico"><ha-icon icon=${p.icone}></ha-icon></span><span class="titre">${p.titre}<small>${p.detail}</small></span></button></li>`)}</ul>`
          : html`<div class="calme"><ha-icon icon="mdi:check-circle-outline"></ha-icon>${tx.toutVaBien}</div>`}
      </div>
      ${favoris.length ? html`<div class="commandes">${favoris.map((id) => this.commande(hass, m, id))}</div>` : nothing}
    </div>`;
  }

  /** Un favori en grand bouton : un toucher allume ou éteint, sinon ouvre l'appareil. */
  private commande(hass: HomeAssistant, m: Maison, id: string): TemplateResult {
    const etat = hass.states[id];
    const domaine = id.split(".")[0];
    const actif = ["on", "open", "playing", "heat", "cool", "auto", "heat_cool"].includes(etat.state);
    const agir = () => {
      if (BASCULE.has(domaine) && hass.callService) hass.callService(domaine, "toggle", { entity_id: id });
      else if ((domaine === "scene" || domaine === "script") && hass.callService) hass.callService(domaine, "turn_on", { entity_id: id });
      else plusDInfos(this, id);
    };
    return html`<button class=${actif ? "commande actif" : "commande"} @click=${agir}>
      <ha-state-icon .hass=${hass} .stateObj=${etat}></ha-state-icon>
      <span>${m.noms[id] || nomCourt(hass, id, m.noms)}</span></button>`;
  }
}
