"""Ajout de CentralHome en un clic, sans aucune question."""

from __future__ import annotations

from typing import Any

from homeassistant.config_entries import ConfigFlow, ConfigFlowResult

from .const import DOMAIN


class CentralHomeConfigFlow(ConfigFlow, domain=DOMAIN):
    """Un seul écran de confirmation, puis c'est prêt."""

    VERSION = 1

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        if user_input is not None:
            return self.async_create_entry(title="CentralHome", data={})
        return self.async_show_form(step_id="user")
