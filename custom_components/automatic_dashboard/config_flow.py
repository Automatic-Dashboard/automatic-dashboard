"""Ajout d'Automatic Dashboard en un écran : créer le tableau, et en faire celui de tout le monde si on veut."""

from __future__ import annotations

from typing import Any

from homeassistant.config_entries import ConfigFlow, ConfigFlowResult

from .const import CONF_CREER_TABLEAU, CONF_PAR_DEFAUT, DOMAIN

try:  # Home Assistant 2026 a remplacé voluptuous par probatio.
    import probatio as vol
except ImportError:  # pragma: no cover
    import voluptuous as vol

SCHEMA = vol.Schema(
    {
        vol.Required(CONF_CREER_TABLEAU, default=True): bool,
        vol.Required(CONF_PAR_DEFAUT, default=False): bool,
    }
)


class AutomaticConfigFlow(ConfigFlow, domain=DOMAIN):
    """Un seul écran, deux cases, puis c'est prêt."""

    VERSION = 1

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        if user_input is not None:
            return self.async_create_entry(
                title="Automatic Dashboard",
                data={
                    CONF_CREER_TABLEAU: bool(user_input.get(CONF_CREER_TABLEAU, True)),
                    CONF_PAR_DEFAUT: bool(user_input.get(CONF_PAR_DEFAUT, False)),
                },
            )
        return self.async_show_form(step_id="user", data_schema=SCHEMA)
