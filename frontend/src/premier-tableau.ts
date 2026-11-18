// Le premier tableau, créé tout seul : si la case était cochée à l'ajout de l'intégration,
// le premier administrateur qui ouvre Home Assistant voit le tableau apparaître dans la
// barre latérale (et devenir celui de tout le monde, si c'était demandé). Une seule fois.

import type { HomeAssistant } from "./ha";
import { naviguer, t } from "./outils";

export const URL_TABLEAU = "automatic-dashboard";

/** Attend que Home Assistant ait chargé l'utilisateur (une minute au plus). */
async function attendreHass(): Promise<HomeAssistant | null> {
  for (let i = 0; i < 120; i++) {
    const hass = (document.querySelector("home-assistant") as (Element & { hass?: HomeAssistant }) | null)?.hass;
    if (hass?.user && hass.connection) return hass;
    await new Promise((r) => setTimeout(r, 500));
  }
  return null;
}

export async function preparerPremierTableau(): Promise<void> {
  const hass = await attendreHass();
  if (!hass?.user?.is_admin) return;
  const afaire = await hass.callWS<{ creer: boolean; par_defaut: boolean }>({ type: "automatic_dashboard/a_faire" }).catch(() => null);
  if (!afaire?.creer) return;
  const tableaux = await hass.callWS<{ url_path: string }[]>({ type: "lovelace/dashboards/list" }).catch(() => []);
  if (!tableaux.some((t) => t.url_path === URL_TABLEAU)) {
    await hass.callWS({ type: "lovelace/dashboards/create", url_path: URL_TABLEAU, title: "Automatic Dashboard", icon: "mdi:home-roof",
      show_in_sidebar: true, require_admin: false });
    await hass.callWS({ type: "lovelace/config/save", url_path: URL_TABLEAU, config: { strategy: { type: "custom:automatic-dashboard" } } });
  }
  if (afaire.par_defaut) {
    const systeme = (hass as { systemData?: Record<string, unknown> }).systemData ?? {};
    await hass.callWS({ type: "frontend/set_system_data", key: "core", value: { ...systeme, default_panel: URL_TABLEAU } }).catch(() => undefined);
  }
  await hass.callWS({ type: "automatic_dashboard/fait" });
  const tx = t(hass);
  document.querySelector("home-assistant")?.dispatchEvent(new CustomEvent("hass-notification", {
    detail: {
      message: tx.tableauPret,
      duration: 15000,
      action: { text: tx.ouvrir, action: () => naviguer(`/${URL_TABLEAU}`) },
    },
    bubbles: true, composed: true,
  }));
}
