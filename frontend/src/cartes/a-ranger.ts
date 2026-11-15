// La liste à ranger : les appareils sans pièce, groupés par intégration, chacun avec
// « Choisir ».

import { css, html, type TemplateResult } from "lit";
import type { HomeAssistant } from "../ha";
import type { Entite, Maison } from "../moteur/types";
import { estFrancais, majuscule, naviguer, plusDInfos } from "../outils";
import { CarteCentralHome, type OptionsGrille } from "./base";
import { STYLE_COMMUN } from "./styles";

const ICONES_DOMAINES: Record<string, string> = {
  light: "mdi:lightbulb-outline", switch: "mdi:toggle-switch-variant", fan: "mdi:fan", cover: "mdi:window-shutter",
  climate: "mdi:thermostat", sensor: "mdi:eye-outline", binary_sensor: "mdi:checkbox-blank-circle-outline", lock: "mdi:lock-outline",
  alarm_control_panel: "mdi:shield-home-outline", media_player: "mdi:speaker", vacuum: "mdi:robot-vacuum", camera: "mdi:cctv",
};
const NOMS_INTEGRATIONS: Record<string, string> = {
  demo: "Démonstration", mqtt: "MQTT", template: "Modèles", zha: "Zigbee (ZHA)", matter: "Matter", hue: "Philips Hue", esphome: "ESPHome",
};

export class CentralHomeARanger extends CarteCentralHome {
  static override styles = [STYLE_COMMUN, css`
    ha-card{padding:6px 18px 10px}
    .groupe{font-size:11.5px;font-weight:650;letter-spacing:.08em;text-transform:uppercase;color:var(--secondary-text-color);padding:12px 0 4px}
    .ligne{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px;min-height:54px;border-top:1px solid var(--divider-color)}
    .groupe + .ligne{border-top:0}
    .nom{font-weight:600;font-size:14.5px;color:var(--primary-text-color)}
    .nom small{display:block;font-weight:500;font-size:12.5px;color:var(--secondary-text-color);margin-top:2px}
    .choisir{display:inline-flex;align-items:center;gap:2px;font-size:14px;font-weight:650;color:var(--primary-color)}
    .choisir ha-icon{--mdc-icon-size:18px}
  `];

  getGridOptions(): OptionsGrille {
    return { columns: "full", rows: "auto" };
  }

  protected override rendu(hass: HomeAssistant, m: Maison): TemplateResult | null {
    if (!m.aRanger.length) return null;
    const fr = estFrancais(hass);
    const groupes = new Map<string, Entite[]>();
    for (const e of m.aRanger) {
      if (!groupes.has(e.plateforme)) groupes.set(e.plateforme, []);
      groupes.get(e.plateforme)!.push(e);
    }
    const nbEntites = (deviceId: string) => Object.values(hass.entities).filter((x) => x.device_id === deviceId && !x.hidden).length;
    const contenu: TemplateResult[] = [];
    for (const [plateforme, liste] of groupes) {
      const titre = hass.localize?.(`component.${plateforme}.title`) || NOMS_INTEGRATIONS[plateforme] || majuscule(plateforme);
      contenu.push(html`<div class="groupe">${titre}</div>`);
      for (const e of liste) {
        const appareil = e.appareil ? hass.devices[e.appareil] : undefined;
        const nom = appareil?.name_by_user || appareil?.name || e.etat.attributes.friendly_name;
        const n = appareil ? nbEntites(e.appareil!) : 1;
        const detail = appareil ? (fr ? `${n} entité${n > 1 ? "s" : ""}` : `${n} entit${n > 1 ? "ies" : "y"}`) : (fr ? "sans appareil" : "no device");
        contenu.push(html`<div class="ligne"><span class="ico"><ha-icon icon=${ICONES_DOMAINES[e.domaine] || "mdi:devices"}></ha-icon></span>
          <span class="nom">${nom}<small>${detail}</small></span>
          <button class="choisir" @click=${() => this.choisir(e)}>${fr ? "Choisir" : "Choose"}<ha-icon icon="mdi:chevron-right"></ha-icon></button></div>`);
      }
    }
    return html`<ha-card>${contenu}</ha-card>`;
  }

  // L'administrateur choisit la pièce dans la page de l'appareil ; sinon, la fenêtre de l'entité.
  private choisir(e: Entite): void {
    if (e.appareil && this.hass?.user?.is_admin) naviguer(`/config/devices/device/${e.appareil}`);
    else plusDInfos(this, e.id);
  }
}
