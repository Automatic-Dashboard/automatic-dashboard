"""L'ajout d'Automatic Dashboard : un seul écran, aucune question, une seule installation."""

from __future__ import annotations

from unittest.mock import patch

from homeassistant import config_entries
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.automatic_dashboard.const import DOMAIN


async def test_un_ecran_deux_cases_puis_c_est_pret(hass: HomeAssistant) -> None:
    # Le frontend et le serveur web ne sont pas démarrés dans les tests : on les dit déjà prêts.
    hass.config.components.update({"frontend", "http"})
    resultat = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})
    assert resultat["type"] is FlowResultType.FORM
    assert resultat["step_id"] == "user"
    # Deux cases : créer le tableau (cochée), en faire celui de tout le monde (décochée).
    defauts = {str(cle): cle.default() for cle in resultat["data_schema"].schema}
    assert defauts == {"creer_tableau": True, "par_defaut": False}

    # La mise en place elle-même est essayée dans test_init.py.
    with patch("custom_components.automatic_dashboard.async_setup_entry", return_value=True) as mise_en_place:
        choix = {"creer_tableau": True, "par_defaut": True}
        fin = await hass.config_entries.flow.async_configure(resultat["flow_id"], choix)
        await hass.async_block_till_done()
    mise_en_place.assert_called_once()
    assert fin["type"] is FlowResultType.CREATE_ENTRY
    assert fin["title"] == "Automatic Dashboard"
    assert fin["data"] == {"creer_tableau": True, "par_defaut": True}


async def test_une_seule_installation(hass: HomeAssistant) -> None:
    MockConfigEntry(domain=DOMAIN, title="Automatic Dashboard").add_to_hass(hass)
    resultat = await hass.config_entries.flow.async_init(DOMAIN, context={"source": config_entries.SOURCE_USER})
    assert resultat["type"] is FlowResultType.ABORT
    assert resultat["reason"] == "single_instance_allowed"
