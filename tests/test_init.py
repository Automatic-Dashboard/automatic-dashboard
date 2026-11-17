"""La mise en place : le tableau est servi et chargé dans l'interface, le thème est installé,
et une réparation explique quoi faire si Home Assistant ne charge pas les thèmes.

Le frontend et le serveur web de Home Assistant ne sont pas démarrés : on remplace le
service de rechargement des thèmes et l'enregistrement des chemins statiques.
"""

from __future__ import annotations

from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.helpers import issue_registry as ir
from homeassistant.helpers import label_registry as lr
from homeassistant.loader import async_get_integration
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.automatic_dashboard.const import (
    DOMAIN,
    ETIQUETTES,
    ISSUE_THEMES,
    JS_FILE,
    THEME_FILE,
    THEME_NAME,
    URL_BASE,
)

SOURCE_THEME = Path(__file__).parents[1] / "custom_components" / DOMAIN / "themes" / THEME_FILE


@pytest.fixture
def maison(hass: HomeAssistant, tmp_path: Path) -> HomeAssistant:
    """Un Home Assistant dont la configuration est dans un dossier temporaire, frontend et http simulés."""
    hass.config.config_dir = str(tmp_path)
    hass.config.components.update({"frontend", "http"})
    hass.http = MagicMock(async_register_static_paths=AsyncMock())
    return hass


def themes_lus(hass: HomeAssistant, avec_la_ligne: bool) -> list[ServiceCall]:
    """Remplace frontend.reload_themes : il lit le dossier themes/ seulement si configuration.yaml le demande."""
    appels: list[ServiceCall] = []

    async def recharger(appel: ServiceCall) -> None:
        appels.append(appel)
        dossier = Path(hass.config.path("themes"))
        hass.data["frontend_themes"] = {THEME_NAME: {}} if avec_la_ligne and (dossier / THEME_FILE).exists() else {}

    hass.services.async_register("frontend", "reload_themes", recharger)
    return appels


async def installer(hass: HomeAssistant) -> tuple[MockConfigEntry, MagicMock]:
    entree = MockConfigEntry(domain=DOMAIN, title="Automatic Dashboard")
    entree.add_to_hass(hass)
    with patch("custom_components.automatic_dashboard.add_extra_js_url") as ajouter:
        assert await hass.config_entries.async_setup(entree.entry_id)
        await hass.async_block_till_done()
    return entree, ajouter


async def test_le_tableau_est_servi_et_charge(maison: HomeAssistant) -> None:
    themes_lus(maison, avec_la_ligne=True)
    _, ajouter = await installer(maison)

    (chemins,), _ = maison.http.async_register_static_paths.call_args
    assert chemins[0].url_path == URL_BASE
    assert (Path(chemins[0].path) / JS_FILE).is_file()
    assert chemins[0].cache_headers is False

    # La version dans l'adresse oblige le navigateur à reprendre le fichier après une mise à jour.
    version = (await async_get_integration(maison, DOMAIN)).version
    ajouter.assert_called_once_with(maison, f"{URL_BASE}/{JS_FILE}?v={version}")


async def test_le_theme_est_copie_et_charge(maison: HomeAssistant) -> None:
    appels = themes_lus(maison, avec_la_ligne=True)
    await installer(maison)

    copie = Path(maison.config.path("themes", THEME_FILE))
    assert copie.read_bytes() == SOURCE_THEME.read_bytes()
    assert len(appels) == 1
    assert ir.async_get(maison).async_get_issue(DOMAIN, ISSUE_THEMES) is None


async def test_le_theme_n_est_pas_recopie_s_il_n_a_pas_change(maison: HomeAssistant) -> None:
    themes_lus(maison, avec_la_ligne=True)
    copie = Path(maison.config.path("themes", THEME_FILE))
    copie.parent.mkdir()
    copie.write_bytes(SOURCE_THEME.read_bytes())
    avant = copie.stat().st_mtime_ns

    await installer(maison)
    assert copie.stat().st_mtime_ns == avant


async def test_une_reparation_si_la_ligne_des_themes_manque(maison: HomeAssistant) -> None:
    themes_lus(maison, avec_la_ligne=False)
    await installer(maison)

    reparation = ir.async_get(maison).async_get_issue(DOMAIN, ISSUE_THEMES)
    assert reparation is not None
    assert reparation.severity is ir.IssueSeverity.WARNING
    assert reparation.is_fixable is False
    assert reparation.translation_key == ISSUE_THEMES


async def test_la_reparation_disparait_quand_le_theme_est_charge(maison: HomeAssistant) -> None:
    themes_lus(maison, avec_la_ligne=False)
    entree, _ = await installer(maison)
    assert ir.async_get(maison).async_get_issue(DOMAIN, ISSUE_THEMES) is not None

    # L'utilisateur ajoute la ligne et redémarre : au rechargement, la réparation s'en va.
    themes_lus(maison, avec_la_ligne=True)
    with (
        patch("custom_components.automatic_dashboard.add_extra_js_url"),
        patch("custom_components.automatic_dashboard.remove_extra_js_url"),
    ):
        assert await maison.config_entries.async_reload(entree.entry_id)
        await maison.async_block_till_done()
    assert ir.async_get(maison).async_get_issue(DOMAIN, ISSUE_THEMES) is None


async def test_dechargement_et_rechargement(maison: HomeAssistant) -> None:
    themes_lus(maison, avec_la_ligne=False)
    entree, ajouter = await installer(maison)
    url = ajouter.call_args.args[1]

    with patch("custom_components.automatic_dashboard.remove_extra_js_url") as retirer:
        assert await maison.config_entries.async_unload(entree.entry_id)
        await maison.async_block_till_done()
    retirer.assert_called_once_with(maison, url)
    assert ir.async_get(maison).async_get_issue(DOMAIN, ISSUE_THEMES) is None

    # Un chemin statique ne se retire pas : au rechargement, il n'est pas enregistré une deuxième fois.
    with patch("custom_components.automatic_dashboard.add_extra_js_url"):
        assert await maison.config_entries.async_setup(entree.entry_id)
        await maison.async_block_till_done()
    assert maison.http.async_register_static_paths.await_count == 1


async def test_les_etiquettes_sont_creees_dans_la_langue_de_home_assistant(maison: HomeAssistant) -> None:
    themes_lus(maison, avec_la_ligne=True)
    maison.config.language = "fr"
    entree, _ = await installer(maison)

    registre = lr.async_get(maison)
    ids = {e.label_id: e for e in registre.async_list_labels()}
    assert {"automatic_dashboard_masquer", "automatic_dashboard_favori", "automatic_dashboard_exterieur"} <= set(ids)
    # Chaque identifiant créé est l'un de ceux que le tableau reconnaît.
    for etiquette in ETIQUETTES.values():
        assert etiquette["ids"][0] in ids
    assert ids["automatic_dashboard_exterieur"].name == "Automatic Dashboard : extérieur"
    assert ids["automatic_dashboard_masquer"].icon == "mdi:eye-off-outline"
    assert entree.data["etiquettes"] is True


async def test_les_etiquettes_en_anglais_ont_les_identifiants_reconnus(maison: HomeAssistant) -> None:
    themes_lus(maison, avec_la_ligne=True)
    maison.config.language = "en"
    await installer(maison)
    ids = {e.label_id for e in lr.async_get(maison).async_list_labels()}
    assert {etiquette["ids"][1] for etiquette in ETIQUETTES.values()} <= ids


async def test_une_etiquette_supprimee_nest_pas_recreee(maison: HomeAssistant) -> None:
    themes_lus(maison, avec_la_ligne=True)
    entree, _ = await installer(maison)
    registre = lr.async_get(maison)
    for e in list(registre.async_list_labels()):
        registre.async_delete(e.label_id)

    with (
        patch("custom_components.automatic_dashboard.add_extra_js_url"),
        patch("custom_components.automatic_dashboard.remove_extra_js_url"),
    ):
        assert await maison.config_entries.async_reload(entree.entry_id)
        await maison.async_block_till_done()
    assert list(registre.async_list_labels()) == []


async def test_une_etiquette_du_meme_nom_nest_pas_dupliquee(maison: HomeAssistant) -> None:
    themes_lus(maison, avec_la_ligne=True)
    maison.config.language = "en"
    lr.async_get(maison).async_create("Automatic Dashboard: hide")
    await installer(maison)
    noms = [e.name for e in lr.async_get(maison).async_list_labels()]
    assert noms.count("Automatic Dashboard: hide") == 1
