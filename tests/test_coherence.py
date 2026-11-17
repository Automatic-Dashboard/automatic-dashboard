"""Ce qui doit rester cohérent d'un fichier à l'autre : traductions, thème, numéros de version."""

from __future__ import annotations

import json
from pathlib import Path

import yaml

RACINE = Path(__file__).parents[1]
INTEGRATION = RACINE / "custom_components" / "automatic_dashboard"


def cles(donnees: dict, prefixe: str = "") -> set[str]:
    resultat: set[str] = set()
    for cle, valeur in donnees.items():
        chemin = f"{prefixe}.{cle}" if prefixe else cle
        resultat |= cles(valeur, chemin) if isinstance(valeur, dict) else {chemin}
    return resultat


def test_les_traductions_ont_toutes_les_cles() -> None:
    reference = cles(json.loads((INTEGRATION / "strings.json").read_text()))
    for langue in ("en", "fr"):
        assert cles(json.loads((INTEGRATION / "translations" / f"{langue}.json").read_text())) == reference, langue


def test_le_theme_a_un_mode_clair_et_un_mode_sombre() -> None:
    theme = yaml.safe_load((INTEGRATION / "themes" / "automatic_dashboard.yaml").read_text())
    modes = theme["Automatic Dashboard"]["modes"]
    assert set(modes) == {"light", "dark"}
    # Les mêmes variables dans les deux modes : rien ne retombe sur une couleur par défaut d'un seul côté.
    assert set(modes["light"]) == set(modes["dark"])


def test_une_seule_version_partout() -> None:
    manifeste = json.loads((INTEGRATION / "manifest.json").read_text())["version"]
    tableau = json.loads((RACINE / "frontend" / "package.json").read_text())["version"]
    assert manifeste == tableau


def test_le_fichier_du_tableau_est_construit() -> None:
    fichier = INTEGRATION / "frontend" / "automatic-dashboard.js"
    assert fichier.is_file()
    assert "ll-strategy-dashboard-automatic-dashboard" in fichier.read_text()
