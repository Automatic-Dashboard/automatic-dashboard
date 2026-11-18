// Les trois éléments de Home Assistant dont les cartes Automatic Dashboard ont besoin, en
// version minimale pour la démo : la carte (ha-card), l'icône (ha-icon) et l'icône d'un état
// (ha-state-icon). Ils ne sont définis que s'ils n'existent pas déjà.

import icones from "virtual:icones-demo";
import { css, html, LitElement, type PropertyDeclarations, svg } from "lit";
import type { EtatHA } from "../ha";

class DemoCarte extends LitElement {
  static override styles = css`
    :host{display:block;box-sizing:border-box;height:100%;background:var(--ha-card-background,var(--card-background-color,#fff));
      border-radius:var(--ha-card-border-radius,12px);border:var(--ha-card-border-width,1px) solid var(--ha-card-border-color,var(--divider-color,rgba(0,0,0,.12)));
      box-shadow:var(--ha-card-box-shadow,none);color:var(--primary-text-color);overflow:hidden}
  `;

  override render() {
    return html`<slot></slot>`;
  }
}

export class DemoIcone extends LitElement {
  static override properties: PropertyDeclarations = { icon: {} };
  declare icon?: string;

  static override styles = css`
    :host{display:inline-flex;align-items:center;justify-content:center;vertical-align:middle;width:var(--mdc-icon-size,24px);height:var(--mdc-icon-size,24px);fill:currentColor;flex:none}
    svg{width:100%;height:100%}
  `;

  override render() {
    const trace = icones[this.icon ?? ""] ?? icones["mdi:circle-small"] ?? "";
    return html`<svg viewBox="0 0 24 24" aria-hidden="true">${svg`<path d=${trace}></path>`}</svg>`;
  }
}

/** L'icône d'un état, comme Home Assistant la choisirait : celle de l'entité, sinon selon le domaine et l'état. */
export function iconeEtat(e?: EtatHA): string {
  if (!e) return "mdi:bookmark-outline";
  if (typeof e.attributes.icon === "string") return e.attributes.icon;
  const [domaine] = e.entity_id.split(".");
  const on = ["on", "open", "unlocked", "playing", "home", "heat", "cool", "cleaning"].includes(e.state);
  const classe = String(e.attributes.device_class ?? "");
  const parClasse: Record<string, [string, string]> = {
    window: ["mdi:window-open-variant", "mdi:window-closed-variant"], door: ["mdi:door-open", "mdi:door-closed"],
    garage_door: ["mdi:garage-open", "mdi:garage"], moisture: ["mdi:water-alert", "mdi:water-off"],
    smoke: ["mdi:smoke-detector-variant-alert", "mdi:smoke-detector-variant"], motion: ["mdi:motion-sensor", "mdi:motion-sensor-off"],
    occupancy: ["mdi:home-account", "mdi:home-outline"], outlet: ["mdi:power-plug", "mdi:power-plug-off"],
    shutter: ["mdi:window-shutter-open", "mdi:window-shutter"], temperature: ["mdi:thermometer", "mdi:thermometer"],
    humidity: ["mdi:water-percent", "mdi:water-percent"], power: ["mdi:flash", "mdi:flash"], energy: ["mdi:lightning-bolt", "mdi:lightning-bolt"],
    battery: ["mdi:battery-60", "mdi:battery-60"], carbon_dioxide: ["mdi:molecule-co2", "mdi:molecule-co2"],
  };
  if (parClasse[classe]) return parClasse[classe][on ? 0 : 1];
  const parDomaine: Record<string, [string, string]> = {
    light: ["mdi:lightbulb", "mdi:lightbulb-outline"], switch: ["mdi:toggle-switch-variant", "mdi:toggle-switch-variant-off"],
    fan: ["mdi:fan", "mdi:fan-off"], cover: ["mdi:window-shutter-open", "mdi:window-shutter"], lock: ["mdi:lock-open-variant", "mdi:lock"],
    climate: ["mdi:thermostat", "mdi:thermostat"], media_player: ["mdi:speaker-play", "mdi:speaker"], vacuum: ["mdi:robot-vacuum", "mdi:robot-vacuum"],
    alarm_control_panel: ["mdi:shield-off-outline", "mdi:shield-home"], person: ["mdi:account", "mdi:account-outline"],
    weather: ["mdi:weather-partly-cloudy", "mdi:weather-partly-cloudy"], update: ["mdi:package-up", "mdi:package"],
    water_heater: ["mdi:water-boiler", "mdi:water-boiler-off"], scene: ["mdi:palette", "mdi:palette"], script: ["mdi:script-text", "mdi:script-text"],
    binary_sensor: ["mdi:checkbox-marked-circle", "mdi:radiobox-blank"], sensor: ["mdi:eye", "mdi:eye"], calendar: ["mdi:calendar", "mdi:calendar"],
    todo: ["mdi:clipboard-list", "mdi:clipboard-list"], sun: ["mdi:white-balance-sunny", "mdi:weather-night"],
  };
  if (domaine === "alarm_control_panel") return e.state === "disarmed" ? "mdi:shield-off-outline" : "mdi:shield-lock";
  if (domaine === "sun") return e.state === "above_horizon" ? "mdi:white-balance-sunny" : "mdi:weather-night";
  return parDomaine[domaine]?.[on ? 0 : 1] ?? "mdi:bookmark-outline";
}

class DemoIconeEtat extends LitElement {
  static override properties: PropertyDeclarations = { stateObj: { attribute: false }, icon: {}, hass: { attribute: false } };
  declare stateObj?: EtatHA;
  declare icon?: string;

  static override styles = css`:host{display:inline-flex;--mdc-icon-size:inherit}`;

  override render() {
    return html`<ha-icon .icon=${this.icon || iconeEtat(this.stateObj)}></ha-icon>`;
  }
}

/** Définit les éléments qui manquent (hors de Home Assistant). */
export function definirElements(): void {
  const elements: [string, CustomElementConstructor][] = [["ha-card", DemoCarte], ["ha-icon", DemoIcone], ["ha-state-icon", DemoIconeEtat]];
  for (const [balise, classe] of elements) if (!customElements.get(balise)) customElements.define(balise, classe);
}
