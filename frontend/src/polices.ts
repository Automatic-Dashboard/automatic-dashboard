// La police Inter, servie par l'intégration, et une police de repli aux mêmes
// proportions (pas de saut de mise en page pendant le chargement). Les @font-face
// doivent vivre dans le document : déclarées dans un shadow DOM, elles sont ignorées.

const BASE = "/automatic_dashboard_static";

export function chargerPolices(): void {
  if (document.getElementById("automatic-dashboard-polices")) return;
  const style = document.createElement("style");
  style.id = "automatic-dashboard-polices";
  style.textContent = `
    @font-face{font-family:"Inter";font-style:normal;font-weight:100 900;font-display:swap;
      src:url("${BASE}/inter-latin.woff2") format("woff2");
      unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
    @font-face{font-family:"Inter repli";src:local("Arial"),local("Helvetica Neue"),local("Roboto");
      size-adjust:107%;ascent-override:90%;descent-override:22.5%;line-gap-override:0%}`;
  document.head.appendChild(style);
}
