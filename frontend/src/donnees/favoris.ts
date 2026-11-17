// Les favoris de chacun : gardés dans les données de l'utilisateur de Home Assistant (les
// mêmes sur tous ses écrans). Quand une personne a choisi les siens, ils remplacent les
// favoris épinglés du tableau, pour elle seulement.

import type { HomeAssistant } from "../ha";

const CLE = "automatic_dashboard_favoris";

/** Les favoris choisis par la personne connectée ([] si elle n'en a pas choisi). */
export async function lireFavorisPerso(hass: HomeAssistant): Promise<string[]> {
  try {
    const r = await hass.callWS<{ value?: unknown }>({ type: "frontend/get_user_data", key: CLE });
    return Array.isArray(r?.value) ? r.value.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export async function ecrireFavorisPerso(hass: HomeAssistant, ids: string[]): Promise<void> {
  await hass.callWS({ type: "frontend/set_user_data", key: CLE, value: ids.length ? [...new Set(ids)] : null });
}
