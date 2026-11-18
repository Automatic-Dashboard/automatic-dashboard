// La démo : le tableau généré par la vraie stratégie, pour la maison fictive, mis en page comme
// une vue en sections de Home Assistant (une scène et un côté selon la largeur). Les cartes sont
// les vraies cartes Automatic Dashboard ; les rares cartes natives sont remplacées (natives.ts).
// On peut changer de page, toucher les favoris, ranger un appareil, et jouer quelques scénarios.

import { css, html, LitElement, nothing, type PropertyDeclarations, type TemplateResult, unsafeCSS } from "lit";
import { poserStyle } from "../cartes/style";
import theme from "virtual:theme-demo";
import type { HomeAssistant } from "../ha";
import { genererTableau } from "../strategie/strategie";
import type { CarteConfig, SectionConfig, VueConfig } from "../strategie/configs";
import { MaisonDemo } from "./maison";
import { brancherJournal, NATIVES } from "./natives";
import { TEXTES_DEMO } from "./textes";

type Langue = "fr" | "en";
type Carte = HTMLElement & { hass?: HomeAssistant; setConfig?: (c: CarteConfig) => void; getGridOptions?: () => { columns?: number | "full"; rows?: number | "auto" } };

const sombre = () => window.matchMedia("(prefers-color-scheme: dark)").matches;

export class AutomaticDashboardDemo extends LitElement {
  static override properties: PropertyDeclarations = {
    _vue: { state: true }, _colonnes: { state: true }, _message: { state: true }, _hass: { state: true },
  };
  private declare _vue: string;
  private declare _colonnes: number;
  private declare _message: string;
  private declare _hass: HomeAssistant;
  private readonly langue: Langue = document.documentElement.lang.startsWith("fr") ? "fr" : "en";
  private readonly maison = new MaisonDemo(this.langue, sombre);
  private vues: VueConfig[] = [];
  private registres: unknown[] = [];
  private readonly cartes = new Map<string, Carte>();
  private observateur?: ResizeObserver;
  private minuterie?: number;

  constructor() {
    super();
    this._vue = "accueil";
    this._colonnes = 3;
    this._message = "";
    this._hass = this.maison.hass;
    brancherJournal(this.maison.journal);
    this.maison.suivre((hass) => {
      this._hass = hass;
      void this.construire();
    });
  }

  static override styles = [unsafeCSS(theme), css`
    :host{display:block}
    .ad-demo{--card-background-color:var(--ha-card-background, #fff);--divider-color:rgba(11,30,45,.1);
      font-family:var(--ha-font-family-body, Inter, sans-serif);color:var(--primary-text-color);background:var(--primary-background-color);
      border-radius:28px;border:1px solid var(--divider-color);overflow:hidden}
    @media (prefers-color-scheme: dark){.ad-demo{--divider-color:rgba(238,244,249,.12)}}
    .barre{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:14px 18px;border-bottom:1px solid var(--divider-color);background:var(--card-background-color)}
    .barre strong{font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:var(--primary-color);margin-right:6px}
    .barre button{font:inherit;font-size:13.5px;font-weight:600;height:34px;padding:0 14px;border-radius:17px;border:1px solid var(--divider-color);
      background:var(--secondary-background-color);color:var(--primary-text-color);cursor:pointer}
    .barre button[aria-pressed="true"]{background:var(--primary-color);border-color:var(--primary-color);color:var(--text-primary-color, #fff)}
    .barre .remettre{background:none;color:var(--secondary-text-color)}
    .gestes{display:flex;flex-wrap:wrap;gap:8px}
    /* Sur téléphone, les gestes défilent sur une ligne pour laisser la place au tableau. */
    @media (max-width: 640px){.gestes{flex-wrap:nowrap;overflow-x:auto;margin:0 -18px;padding:0 18px 4px;scrollbar-width:none}.gestes button{flex:none}}
    .aide{flex-basis:100%;margin:2px 0 0;font-size:13px;color:var(--secondary-text-color)}
    .vue{padding:20px clamp(12px,3vw,28px) 28px;min-height:420px}
    .retour{display:inline-flex;align-items:center;gap:6px;margin:0 0 10px;font:inherit;font-size:14px;font-weight:600;border:0;background:none;color:var(--primary-color);cursor:pointer;padding:0}
    .entete{display:grid;gap:12px;margin-bottom:16px}
    .pastilles{display:flex;flex-wrap:wrap;gap:8px}
    .colonnes{display:grid;gap:16px;align-items:start}
    .colonnes.trois{grid-template-columns:2fr 1fr}
    .pile{display:grid;gap:16px;align-content:start}
    .section{display:grid;grid-template-columns:repeat(var(--cases),minmax(0,1fr));grid-auto-rows:minmax(56px,auto);gap:8px}
    .section > *{min-width:0}
    .message{position:sticky;bottom:12px;margin:12px auto 0;max-width:560px;padding:10px 16px;border-radius:14px;font-size:13.5px;
      background:var(--primary-text-color);color:var(--primary-background-color);box-shadow:0 10px 30px rgba(0,0,0,.2)}
  `];

  override connectedCallback(): void {
    super.connectedCallback();
    // La navigation des cartes reste dans la démo, et « plus d'infos » s'y résume en une phrase.
    (window as unknown as { __automaticDashboardNaviguer?: (c: string) => void }).__automaticDashboardNaviguer = (chemin) => this.aller(chemin);
    this.addEventListener("hass-more-info", this.infos as EventListener);
    this.observateur = new ResizeObserver(([e]) => {
      const l = e.contentRect.width;
      this._colonnes = l >= 1000 ? 3 : l >= 640 ? 2 : 1;
    });
    this.observateur.observe(this);
    this.minuterie = window.setInterval(() => this.maison.mettreLeSoleil(), 5 * 60_000);
    void this.construire();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.observateur?.disconnect();
    window.clearInterval(this.minuterie);
  }

  /** Les pages du tableau, reconstruites quand un registre change (un appareil rangé, par exemple). */
  private async construire(): Promise<void> {
    const h = this._hass;
    const registres = [h.entities, h.devices, h.areas, h.floors];
    if (!this.vues.length || registres.some((r, i) => r !== this.registres[i])) {
      this.registres = registres;
      this.vues = (await genererTableau({}, h)).views;
      this.cartes.clear();
    }
    for (const c of this.cartes.values()) c.hass = h;
    this.requestUpdate();
  }

  private aller(chemin: string): void {
    const page = chemin.replace(/^\/[^/]+\//, "").replace(/^\//, "").split("?")[0];
    if (this.vues.some((v) => v.path === page) && page !== "tablette") {
      this._vue = page;
      this.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      this.dire(TEXTES_DEMO[this.langue].ailleurs(page.split("/").pop() || page));
    }
  }

  private infos = (ev: CustomEvent<{ entityId?: string }>): void => {
    ev.stopPropagation();
    const e = this._hass.states[ev.detail?.entityId ?? ""];
    if (e) this.dire(TEXTES_DEMO[this.langue].plusDInfos(String(e.attributes.friendly_name ?? e.entity_id), this._hass.formatEntityState?.(e) ?? e.state));
  };

  private dire(message: string): void {
    this._message = message;
    window.setTimeout(() => {
      if (this._message === message) this._message = "";
    }, 4500);
  }

  /** Une carte, créée une fois puis gardée : seules ses données changent ensuite. */
  private carte(cle: string, config: CarteConfig): Carte | null {
    const deja = this.cartes.get(cle);
    if (deja) return deja;
    const type = String(config.type);
    const balise = type.startsWith("custom:") ? type.slice(7) : NATIVES[type];
    if (!balise || !customElements.get(balise)) return null;
    const el = document.createElement(balise) as Carte;
    el.setConfig?.(config);
    el.hass = this._hass;
    this.cartes.set(cle, el);
    return el;
  }

  /** Une condition « view_columns » de la stratégie, selon la largeur de la démo. */
  private visible(conditions?: Record<string, unknown>[]): boolean {
    return (conditions ?? []).every((c) => c.condition !== "view_columns"
      || ((c.min === undefined || this._colonnes >= Number(c.min)) && (c.max === undefined || this._colonnes <= Number(c.max))));
  }

  private section(cle: string, s: SectionConfig, cases: number): TemplateResult | typeof nothing {
    if (!this.visible(s.visibility)) return nothing;
    return html`<div class="section" ${poserStyle({ "--cases": String(cases) })}>${s.cards.map((c, i) => {
      if (!this.visible(c.visibility as Record<string, unknown>[] | undefined)) return nothing;
      const el = this.carte(`${cle}/${i}`, c);
      if (!el) return nothing;
      const grille = { ...el.getGridOptions?.(), ...(c.grid_options as object | undefined) } as { columns?: number | "full"; rows?: number | "auto" };
      const colonnes = grille.columns === "full" || !grille.columns ? cases : Math.min(cases, Number(grille.columns));
      const lignes = typeof grille.rows === "number" ? `span ${grille.rows}` : "auto";
      return html`<div ${poserStyle({ gridColumn: `span ${colonnes}`, gridRow: lignes })}>${el}</div>`;
    })}</div>`;
  }

  override render() {
    const tx = TEXTES_DEMO[this.langue];
    const vue = this.vues.find((v) => v.path === this._vue) ?? this.vues[0];
    if (!vue) return html`<div class="ad-demo"><div class="vue"></div></div>`;
    const h = this._hass;
    const colonnes = Math.min(this._colonnes, vue.max_columns ?? 3);
    // Une section qui couvre deux colonnes a 24 cases sur ordinateur, 12 sur téléphone.
    const cases = (s: SectionConfig) => 12 * Math.max(1, Math.min(s.column_span ?? 1, colonnes));
    const scene = html`<div class="pile">${(vue.sections ?? []).map((s, i) => this.section(`${vue.path}/s${i}`, s, cases(s)))}</div>`;
    const cote = vue.sidebar && this.visible(vue.sidebar.visibility)
      ? html`<div class="pile">${vue.sidebar.sections.map((s, i) => this.section(`${vue.path}/c${i}`, s, 12))}</div>` : nothing;
    const entete = (vue as unknown as { header?: { card?: CarteConfig } }).header?.card;
    const badges = ((vue as unknown as { badges?: CarteConfig[] }).badges ?? []);
    return html`<div class="ad-demo">
      <div class="barre"><strong>${tx.essayez}</strong>
        <div class="gestes">${this.scenarios(h)}<button class="remettre" @click=${() => this.maison.remettre()}>${tx.remettre}</button></div>
        <p class="aide">${tx.aide}</p></div>
      <div class="vue">
        ${vue.path !== "accueil" ? html`<button class="retour" @click=${() => (this._vue = "accueil")}><ha-icon icon="mdi:arrow-left"></ha-icon>${tx.retour}</button>` : nothing}
        <div class="entete">${entete ? this.carte(`${vue.path}/entete`, entete) : nothing}
          ${badges.length ? html`<div class="pastilles">${badges.map((b, i) => this.carte(`${vue.path}/b${i}`, b))}</div>` : nothing}</div>
        <div class="colonnes ${cote !== nothing && colonnes >= 3 ? "trois" : ""}">${scene}${cote}</div>
        ${this._message ? html`<div class="message" role="status">${this._message}</div>` : nothing}
      </div></div>`;
  }

  /** Les scénarios du panneau « Essayez » : chacun change la maison, puis la remet comme avant. */
  private scenarios(h: HomeAssistant): TemplateResult[] {
    const tx = TEXTES_DEMO[this.langue].scenarios;
    const m = this.maison;
    const lumieres = Object.keys(h.states).filter((id) => id.startsWith("light."));
    const etat = (id: string) => h.states[id]?.state;
    const liste: [string, boolean, () => void][] = [
      ["fenetre", etat("binary_sensor.fenetre_du_salon") === "on",
        () => m.changer("binary_sensor.fenetre_du_salon", etat("binary_sensor.fenetre_du_salon") === "on" ? "off" : "on")],
      ["fuite", etat("binary_sensor.basement_floor_wet") === "on",
        () => m.changer("binary_sensor.basement_floor_wet", etat("binary_sensor.basement_floor_wet") === "on" ? "off" : "on")],
      ["depart", etat("person.antonin_essai") === "not_home" && etat("person.camille") === "not_home", () => {
        const partis = etat("person.antonin_essai") === "not_home" && etat("person.camille") === "not_home";
        for (const id of ["person.antonin_essai", "person.camille"]) m.changer(id, partis ? "home" : "not_home");
      }],
      ["chaleur", Number(etat("sensor.outside_temperature")) >= 30, () => {
        const chaud = Number(etat("sensor.outside_temperature")) >= 30;
        const depart = (id: string) => m.etatDeDepart(id);
        if (!chaud) {
          m.changer("sun.sun", "above_horizon");
          m.changer("sensor.outside_temperature", "33.5");
          for (const id of Object.keys(h.states).filter((x) => x.startsWith("sensor.temperature_"))) m.changer(id, String(Number(depart(id)) + 6));
        } else {
          m.changer("sensor.outside_temperature", depart("sensor.outside_temperature"));
          for (const id of Object.keys(h.states).filter((x) => x.startsWith("sensor.temperature_"))) m.changer(id, depart(id));
          m.mettreLeSoleil();
        }
      }],
      ["lumieres", lumieres.every((id) => etat(id) === "on"), () => {
        const toutes = lumieres.every((id) => etat(id) === "on");
        for (const id of lumieres) m.changer(id, toutes ? "off" : "on");
      }],
    ];
    return liste.map(([cle, actif, faire]) => html`<button aria-pressed=${actif ? "true" : "false"} @click=${faire}>${tx[cle][actif ? 1 : 0]}</button>`);
  }

}

