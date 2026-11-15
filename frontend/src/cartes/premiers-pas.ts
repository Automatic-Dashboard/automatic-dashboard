// Premiers pas : pour l'administrateur d'une maison en Découverte ; la liste se coche
// toute seule et disparaît quand tout est fait.

import { css, html, nothing, type TemplateResult } from "lit";
import type { HomeAssistant } from "../ha";
import type { Maison } from "../moteur/types";
import type { Textes } from "../textes";
import { naviguer, t, valide } from "../outils";
import { CarteCentralHome, type OptionsGrille } from "./base";
import { STYLE_COMMUN } from "./styles";

interface Etape {
  cle: keyof Textes["etapes"];
  fait: boolean;
  lien: string;
}

/** L'emplacement par défaut d'un Home Assistant neuf (Amsterdam) : la maison n'est pas encore placée. */
const AMSTERDAM = { latitude: 52.3731339, longitude: 4.8903147 };

export class CentralHomePremiersPas extends CarteCentralHome {
  static override styles = [STYLE_COMMUN, css`
    ha-card{padding:16px 18px 10px}
    .titre{font-size:17px;font-weight:700;color:var(--primary-text-color)}
    .sous{font-size:13px;margin:3px 0 8px}
    ol{list-style:none;margin:0;padding:0}
    li{border-top:1px solid var(--divider-color)}
    li button{display:flex;align-items:center;gap:12px;width:100%;min-height:48px;font-size:14.5px;font-weight:550;color:var(--primary-text-color)}
    .coche{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;flex:none;border:2px solid var(--divider-color)}
    .fait .coche{background:var(--centralhome-vert);border-color:var(--centralhome-vert);color:#fff}
    .fait .coche ha-icon{--mdc-icon-size:16px}
    .fait span.texte{color:var(--secondary-text-color);text-decoration:line-through;text-decoration-color:var(--divider-color)}
    .texte{flex:1}
    .fleche{--mdc-icon-size:18px;color:var(--secondary-text-color)}
  `];

  getGridOptions(): OptionsGrille {
    return { columns: 12, rows: "auto" };
  }

  // La sauvegarde automatique : son capteur « prochaine sauvegarde ».
  override suivies(): string[] {
    return [this.prochaineSauvegarde() ?? "sensor.backup_next_scheduled_automatic_backup"];
  }

  // Les intégrations ajoutées et l'emplacement de la maison vivent dans la configuration.
  protected override autresChangements(ancien: HomeAssistant): boolean {
    const hass = this.hass!;
    return (ancien.config.components ?? []).length !== (hass.config.components ?? []).length || ancien.config.latitude !== hass.config.latitude;
  }

  private prochaineSauvegarde(): string | undefined {
    return Object.values(this.hass?.entities ?? {})
      .find((e) => e.platform === "backup" && e.translation_key === "next_scheduled_automatic_backup")?.entity_id;
  }

  protected override rendu(hass: HomeAssistant, m: Maison): TemplateResult | null {
    if (!hass.user?.is_admin) return null;
    const tx = t(hass);
    const c = new Set(hass.config.components ?? []);
    const amsterdam = Math.abs(hass.config.latitude - AMSTERDAM.latitude) < 0.001 && Math.abs(hass.config.longitude - AMSTERDAM.longitude) < 0.001;
    const prochaine = this.prochaineSauvegarde();
    const sauvegardesActives = Boolean(prochaine) && valide(hass.states[prochaine!]);
    const fr = (hass.config.country || "") === "FR";
    const etapes: Etape[] = [
      { cle: "emplacement", fait: !amsterdam, lien: "/_my_redirect/general" },
      fr ? { cle: "meteoFrance", fait: c.has("meteo_france"), lien: "/_my_redirect/config_flow_start?domain=meteo_france" }
        : { cle: "meteo", fait: Boolean(m.meteo), lien: "/_my_redirect/config_flow_start?domain=met" },
      { cle: "feries", fait: c.has("holiday"), lien: "/_my_redirect/config_flow_start?domain=holiday" },
      { cle: "sauvegardes", fait: sauvegardesActives, lien: "/_my_redirect/backup_config" },
      { cle: "pieces", fait: m.aRanger.length === 0 && m.utiles.some((e) => e.piece), lien: "/_my_redirect/areas" },
      { cle: "appli", fait: Object.values(hass.entities).some((e) => e.platform === "mobile_app"), lien: "https://www.home-assistant.io/integrations/mobile_app/#apps" },
    ];
    if (etapes.every((e) => e.fait)) return null;
    return html`<ha-card><div class="titre">${tx.premiersPas}</div><div class="sous doux">${tx.premiersPasDetail}</div><ol>
      ${etapes.map((e) => html`<li class=${e.fait ? "fait" : ""}><button @click=${() => this.ouvrir(e)}><span class="coche">${e.fait ? html`<ha-icon icon="mdi:check"></ha-icon>` : nothing}</span>
        <span class="texte">${tx.etapes[e.cle]}</span>${e.fait ? nothing : html`<ha-icon class="fleche" icon="mdi:chevron-right"></ha-icon>`}</button></li>`)}
      </ol></ha-card>`;
  }

  private ouvrir(e: Etape): void {
    if (e.fait) return;
    if (e.lien.startsWith("http")) window.open(e.lien, "_blank", "noopener");
    else naviguer(e.lien);
  }
}
