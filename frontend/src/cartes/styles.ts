// Le style commun à toutes les cartes Automatic Dashboard : icônes en pastille, surtitres,
// boutons sans habillage, chiffres alignés.

import { css } from "lit";

export const STYLE_COMMUN = css`
  :host{display:block;height:100%;font-family:var(--ha-font-family-body, Inter, sans-serif);container-type:inline-size}
  ha-card{height:100%;box-sizing:border-box;overflow:hidden}
  .ico{display:grid;place-items:center;width:40px;height:40px;border-radius:12px;flex:none;
    background:var(--automatic-dashboard-fond-alt, var(--secondary-background-color));color:var(--secondary-text-color)}
  .ico.actif{background:var(--automatic-dashboard-accent-pale, rgba(2,119,189,.12));color:var(--primary-color)}
  .ico.chaud{background:rgba(233,162,59,.16);color:var(--state-light-active-color, #E9A23B)}
  .ico ha-icon{--mdc-icon-size:22px}
  .doux{color:var(--secondary-text-color)}
  .sur{font-size:11.5px;font-weight:650;letter-spacing:.08em;text-transform:uppercase;color:var(--secondary-text-color)}
  button{all:unset;cursor:pointer;box-sizing:border-box}
  button:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px;border-radius:12px}
  .chiffre{font-variant-numeric:tabular-nums}
  .courbe{display:block;width:100%;height:34px}
  /* En attendant les données : une forme pâle qui respire, à la place de ce qui va arriver. */
  .attente{display:block;border-radius:10px;background:var(--automatic-dashboard-fond-alt, var(--secondary-background-color));
    animation:automatic-dashboard-attente 1.4s ease-in-out infinite}
  @keyframes automatic-dashboard-attente{0%,100%{opacity:1}50%{opacity:.45}}
  @media (prefers-reduced-motion: reduce){ .attente{animation:none} }
`;
