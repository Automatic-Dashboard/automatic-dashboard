// La liste à ranger : les appareils sans pièce, groupés par intégration. Quand le nom
// désigne une pièce (« Lampe du salon »), elle est proposée et se règle en un clic, avec
// « Annuler » ; sinon, « Choisir » ouvre la page de l'appareil.

import { css, html, nothing, type PropertyDeclarations, type TemplateResult } from "lit";
import type { HomeAssistant } from "../ha";
import type { Entite, Maison } from "../moteur/types";
import { naviguer, nomIntegration, plusDInfos, t } from "../outils";
import { CarteAutomatic, type OptionsGrille } from "./base";
import { STYLE_COMMUN } from "./styles";

const ICONES_DOMAINES: Record<string, string> = {
  light: "mdi:lightbulb-outline", switch: "mdi:toggle-switch-variant", fan: "mdi:fan", cover: "mdi:window-shutter",
  climate: "mdi:thermostat", sensor: "mdi:eye-outline", binary_sensor: "mdi:checkbox-blank-circle-outline", lock: "mdi:lock-outline",
  alarm_control_panel: "mdi:shield-home-outline", media_player: "mdi:speaker", vacuum: "mdi:robot-vacuum", camera: "mdi:cctv",
};

/** Un appareil rangé d'un clic, qu'on peut encore remettre « à ranger ». */
interface Range {
  id: string;
  appareil: string | null;
  nom: string;
  piece: string;
  quand: number;
}

// Hors de la carte : Home Assistant redessine la page (et recrée la carte) dès qu'un appareil
// change de pièce. « Annuler » reste proposé quelques minutes.
const DUREE_ANNULER = 5 * 60 * 1000;
let recents: Range[] = [];

export class AutomaticARanger extends CarteAutomatic {
  static override properties: PropertyDeclarations = { ...CarteAutomatic.properties, _version: { state: true }, _enCours: { state: true } };
  /** Change quand la liste des appareils rangés change, pour redessiner. */
  private declare _version: number;
  private declare _enCours: string | null;

  constructor() {
    super();
    this._version = 0;
    this._enCours = null;
  }

  private get ranges(): Range[] {
    recents = recents.filter((r) => Date.now() - r.quand < DUREE_ANNULER);
    return recents;
  }

  static override styles = [STYLE_COMMUN, css`
    ha-card{padding:6px 18px 10px}
    .groupe{font-size:11.5px;font-weight:650;letter-spacing:.08em;text-transform:uppercase;color:var(--secondary-text-color);padding:12px 0 4px}
    .ligne{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px;min-height:54px;border-top:1px solid var(--divider-color)}
    .groupe + .ligne{border-top:0}
    .nom{font-weight:600;font-size:14.5px;color:var(--primary-text-color)}
    .nom small{display:block;font-weight:500;font-size:12.5px;color:var(--secondary-text-color);margin-top:2px}
    .choisir{display:inline-flex;align-items:center;gap:2px;font-size:14px;font-weight:650;color:var(--primary-color)}
    .choisir ha-icon{--mdc-icon-size:18px}
    .actions{display:flex;align-items:center;gap:14px}
    .proposer{display:inline-flex;align-items:center;gap:6px;height:34px;padding:0 14px 0 10px;border-radius:17px;font-size:14px;font-weight:650;
      background:color-mix(in srgb, var(--primary-color) 13%, transparent);color:var(--primary-color);transition:background-color .15s}
    .proposer:hover{background:color-mix(in srgb, var(--primary-color) 22%, transparent)}
    .proposer:disabled{opacity:.5;cursor:default}
    .proposer ha-icon{--mdc-icon-size:18px}
    .choisir.discret{font-weight:600;color:var(--secondary-text-color)}
    .indice{font-size:13.5px;font-weight:600;color:var(--secondary-text-color);padding:0 4px}
    .note{margin:6px 0 4px;padding-top:10px;border-top:1px solid var(--divider-color);font-size:13px;color:var(--secondary-text-color)}
    .range{display:flex;align-items:center;gap:10px;margin:8px 0 2px;padding:10px 12px;border-radius:12px;font-size:14px;
      background:color-mix(in srgb, var(--success-color, #2e7d32) 11%, transparent);color:var(--primary-text-color)}
    .range > ha-icon{--mdc-icon-size:20px;color:var(--success-color, #2e7d32);flex:none}
    .range span{flex:1}
    .range button{font-weight:650;color:var(--primary-color)}
    @media (max-width: 520px){
      .ligne{grid-template-columns:auto 1fr;padding:8px 0}
      .actions{grid-column:2;justify-content:flex-start;flex-wrap:wrap}
    }
    @media (prefers-reduced-motion: reduce){.proposer{transition:none}}
  `];

  getGridOptions(): OptionsGrille {
    return { columns: "full", rows: "auto" };
  }

  protected override rendu(hass: HomeAssistant, m: Maison): TemplateResult | null {
    const ranges = this.ranges;
    if (!m.aRanger.length && !ranges.length) return null;
    const tx = t(hass);
    const admin = Boolean(hass.user?.is_admin);
    const groupes = new Map<string, Entite[]>();
    for (const e of m.aRanger) {
      if (!groupes.has(e.plateforme)) groupes.set(e.plateforme, []);
      groupes.get(e.plateforme)!.push(e);
    }
    const nbEntites = (deviceId: string) => Object.values(hass.entities).filter((x) => x.device_id === deviceId && !x.hidden).length;
    const contenu: TemplateResult[] = [];
    let proposeesSansDroit = 0;
    for (const [plateforme, liste] of groupes) {
      const titre = nomIntegration(hass, plateforme);
      contenu.push(html`<div class="groupe">${titre}</div>`);
      for (const e of liste) {
        const appareil = e.appareil ? hass.devices[e.appareil] : undefined;
        const nom = m.noms[e.id] || appareil?.name_by_user || appareil?.name || e.etat.attributes.friendly_name;
        const n = appareil ? nbEntites(e.appareil!) : 1;
        const detail = appareil ? tx.nbEntites(n) : tx.sansAppareil;
        // Seul un administrateur peut changer la pièce d'un appareil ; les autres voient la proposition.
        const proposee = m.pieces.find((p) => p.area_id === m.propositions[e.id]);
        if (proposee && !admin) proposeesSansDroit++;
        contenu.push(html`<div class="ligne"><span class="ico"><ha-icon icon=${ICONES_DOMAINES[e.domaine] || "mdi:devices"}></ha-icon></span>
          <span class="nom">${nom}<small>${detail}</small></span>
          <span class="actions">
            ${proposee && !admin ? html`<span class="indice">${proposee.name} ?</span>` : nothing}
            ${proposee && admin
              ? html`<button class="proposer" ?disabled=${this._enCours === e.id} @click=${() => this.ranger(e, String(nom), proposee.area_id)}
                  title=${tx.rangerDans(proposee.name)}><ha-icon icon=${proposee.icon}></ha-icon>${proposee.name} ?</button>`
              : nothing}
            <button class=${proposee && admin ? "choisir discret" : "choisir"} @click=${() => this.choisir(e)}>
              ${proposee && admin ? tx.autreChoix : tx.choisir}<ha-icon icon="mdi:chevron-right"></ha-icon></button>
          </span></div>`);
      }
    }
    const confirmations = ranges.map((r) => {
      const piece = hass.areas[r.piece]?.name ?? r.piece;
      return html`<div class="range" role="status"><ha-icon icon="mdi:check-circle"></ha-icon>
        <span>${tx.rangeDans(r.nom, piece)}</span>
        <button @click=${() => this.annuler(r)}>${tx.annuler}</button></div>`;
    });
    const note = proposeesSansDroit
      ? html`<p class="note">${tx.noteAdmin}</p>`
      : nothing;
    return html`<ha-card>${confirmations}${contenu}${note}</ha-card>`;
  }

  /** Range l'appareil (ou l'entité seule) dans la pièce proposée. */
  private async ranger(e: Entite, nom: string, piece: string): Promise<void> {
    this._enCours = e.id;
    try {
      recents = [...recents, { id: e.id, appareil: e.appareil, nom, piece, quand: Date.now() }];
      await this.changerPiece(e.id, e.appareil, piece).catch((erreur) => {
        recents = recents.filter((r) => r.id !== e.id);
        throw erreur;
      });
      this._version++;
    } finally {
      this._enCours = null;
    }
  }

  /** Remet l'appareil « à ranger », comme avant le clic. */
  private async annuler(r: Range): Promise<void> {
    recents = recents.filter((x) => x !== r);
    this._version++;
    await this.changerPiece(r.id, r.appareil, null);
  }

  private changerPiece(id: string, appareil: string | null, piece: string | null): Promise<unknown> {
    return appareil
      ? this.hass!.callWS({ type: "config/device_registry/update", device_id: appareil, area_id: piece })
      : this.hass!.callWS({ type: "config/entity_registry/update", entity_id: id, area_id: piece });
  }

  // L'administrateur choisit la pièce dans la page de l'appareil ; sinon, la fenêtre de l'entité.
  private choisir(e: Entite): void {
    if (e.appareil && this.hass?.user?.is_admin) naviguer(`/config/devices/device/${e.appareil}`);
    else plusDInfos(this, e.id);
  }
}
