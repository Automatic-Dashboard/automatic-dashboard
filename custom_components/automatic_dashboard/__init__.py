"""Automatic Dashboard : un tableau de bord complet, construit tout seul à partir des appareils.

L'intégration ne crée aucune entité. Elle sert le fichier JavaScript du tableau (la
stratégie de tableau et les cartes Automatic Dashboard), le charge dans l'interface, installe
le thème Automatic Dashboard et crée, une fois, les étiquettes de réglage en masse. Aucune
donnée ne quitte Home Assistant.
"""

from __future__ import annotations

import logging
import shutil
from pathlib import Path

from homeassistant.components import websocket_api
from homeassistant.components.frontend import add_extra_js_url, remove_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import issue_registry as ir
from homeassistant.helpers import label_registry as lr
from homeassistant.loader import async_get_integration

from .const import (
    CONF_CREER_TABLEAU,
    CONF_PAR_DEFAUT,
    DOMAIN,
    ETIQUETTES,
    ISSUE_THEMES,
    JS_FILE,
    TABLEAU_CREE,
    THEME_FILE,
    THEME_NAME,
    URL_BASE,
)

try:  # Home Assistant 2026 a remplacé voluptuous par probatio.
    import probatio as vol
except ImportError:  # pragma: no cover
    import voluptuous as vol

_LOGGER = logging.getLogger(__name__)
_ICI = Path(__file__).parent


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Sert et charge le tableau, puis installe le thème."""
    donnees = hass.data.setdefault(DOMAIN, {})

    # Un chemin statique ne peut pas être retiré : on ne l'enregistre qu'une fois par démarrage.
    if not donnees.get("chemin_statique"):
        await hass.http.async_register_static_paths(
            [StaticPathConfig(URL_BASE, str(_ICI / "frontend"), cache_headers=False)]
        )
        donnees["chemin_statique"] = True

    # La version dans l'adresse oblige le navigateur à reprendre le fichier après une mise à jour.
    integration = await async_get_integration(hass, DOMAIN)
    url = f"{URL_BASE}/{JS_FILE}?v={integration.version}"
    add_extra_js_url(hass, url)
    donnees["url"] = url

    await _installer_theme(hass)
    _creer_etiquettes(hass, entry)
    if not donnees.get("commandes"):
        websocket_api.async_register_command(hass, ws_a_faire)
        websocket_api.async_register_command(hass, ws_fait)
        donnees["commandes"] = True
    return True


def _entree(hass: HomeAssistant) -> ConfigEntry | None:
    return next(iter(hass.config_entries.async_entries(DOMAIN)), None)


@websocket_api.websocket_command({vol.Required("type"): "automatic_dashboard/a_faire"})
@websocket_api.require_admin
@callback
def ws_a_faire(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict) -> None:
    """Le premier tableau reste-t-il à créer ? (L'interface le crée au premier chargement d'un administrateur.)"""
    entree = _entree(hass)
    donnees = entree.data if entree else {}
    connection.send_result(
        msg["id"],
        {
            "creer": bool(donnees.get(CONF_CREER_TABLEAU)) and not donnees.get(TABLEAU_CREE),
            "par_defaut": bool(donnees.get(CONF_PAR_DEFAUT)),
        },
    )


@websocket_api.websocket_command({vol.Required("type"): "automatic_dashboard/fait"})
@websocket_api.require_admin
@callback
def ws_fait(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict) -> None:
    """Le premier tableau est créé : on ne le recrée plus, même s'il est supprimé ensuite."""
    if entree := _entree(hass):
        hass.config_entries.async_update_entry(entree, data={**entree.data, TABLEAU_CREE: True})
    connection.send_result(msg["id"])


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Retire le tableau de l'interface (le thème reste, comme un thème installé par HACS)."""
    if url := hass.data.get(DOMAIN, {}).pop("url", None):
        remove_extra_js_url(hass, url)
    ir.async_delete_issue(hass, DOMAIN, ISSUE_THEMES)
    return True


def _creer_etiquettes(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Crée les étiquettes de réglage en masse, dans la langue de Home Assistant, une seule fois.

    Une étiquette supprimée par l'utilisateur n'est pas recréée au démarrage suivant. Elles
    restent après la désinstallation, comme le thème : retirer l'intégration ne doit pas
    effacer des étiquettes posées sur des dizaines d'entités.
    """
    if entry.data.get("etiquettes"):
        return
    registre = lr.async_get(hass)
    langue = "fr" if (hass.config.language or "").startswith("fr") else "en"
    connues = {e.label_id for e in registre.async_list_labels()}
    for etiquette in ETIQUETTES.values():
        nom = etiquette[langue]
        if connues.intersection(etiquette["ids"]) or registre.async_get_label_by_name(nom):
            continue
        registre.async_create(nom, icon=etiquette["icon"], description=etiquette["description"][langue])
    hass.config_entries.async_update_entry(entry, data={**entry.data, "etiquettes": True})


async def _installer_theme(hass: HomeAssistant) -> None:
    """Copie le thème dans le dossier themes/ de la configuration, puis recharge les thèmes.

    Le rechargement ne trouve le thème que si configuration.yaml contient
    « frontend: themes: !include_dir_merge_named themes », présent dans la configuration
    par défaut. Sinon, une réparation explique quoi ajouter ; le tableau marche quand
    même, avec le thème choisi par l'utilisateur.
    """
    source = _ICI / "themes" / THEME_FILE
    dossier = Path(hass.config.path("themes"))
    cible = dossier / THEME_FILE

    def _copier() -> bool:
        dossier.mkdir(exist_ok=True)
        if cible.exists() and cible.read_bytes() == source.read_bytes():
            return False
        shutil.copyfile(source, cible)
        return True

    if await hass.async_add_executor_job(_copier):
        _LOGGER.info("Thème %s copié dans %s", THEME_NAME, dossier)

    await hass.services.async_call("frontend", "reload_themes", blocking=True)
    if THEME_NAME in hass.data.get("frontend_themes", {}):
        ir.async_delete_issue(hass, DOMAIN, ISSUE_THEMES)
        return

    _LOGGER.warning("Le thème %s n'a pas été chargé : la ligne des thèmes manque dans configuration.yaml", THEME_NAME)
    ir.async_create_issue(
        hass,
        DOMAIN,
        ISSUE_THEMES,
        is_fixable=False,
        severity=ir.IssueSeverity.WARNING,
        translation_key=ISSUE_THEMES,
        learn_more_url="https://www.home-assistant.io/integrations/frontend/#themes",
    )
