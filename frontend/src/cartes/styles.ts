// Le style commun à toutes les cartes CentralHome : icônes en pastille, surtitres,
// boutons sans habillage, chiffres alignés.

import { css } from "lit";

export const STYLE_COMMUN = css`
  :host{display:block;height:100%;font-family:var(--ha-font-family-body, Inter, sans-serif);container-type:inline-size}
  ha-card{height:100%;box-sizing:border-box;overflow:hidden}
  .ico{display:grid;place-items:center;width:40px;height:40px;border-radius:12px;flex:none;
    background:var(--centralhome-fond-alt, var(--secondary-background-color));color:var(--secondary-text-color)}
  .ico.actif{background:var(--centralhome-accent-pale, rgba(2,119,189,.12));color:var(--primary-color)}
  .ico.chaud{background:rgba(233,162,59,.16);color:var(--state-light-active-color, #E9A23B)}
  .ico ha-icon{--mdc-icon-size:22px}
  .doux{color:var(--secondary-text-color)}
  .sur{font-size:11.5px;font-weight:650;letter-spacing:.08em;text-transform:uppercase;color:var(--secondary-text-color)}
  button{all:unset;cursor:pointer;box-sizing:border-box}
  button:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px;border-radius:12px}
  .chiffre{font-variant-numeric:tabular-nums}
  .courbe{display:block;width:100%;height:34px}
`;
