"""Prend les captures d'écran du tableau sur les trois maisons d'essai, avec Playwright :
chaque page sur ordinateur et sur téléphone, en thème clair et sombre, plus quelques
cartes seules (pour le site) et la vue d'ensemble native de Home Assistant (pour la
comparaison). Elles servent au README, au site (démo) et aux notes de version.

Chaque maison est ouverte avec son compte administrateur de dev/.secrets/ : le script
se connecte lui-même par le flux de connexion de Home Assistant, sans jamais afficher le
mot de passe ni le jeton.

Usage (les trois maisons doivent tourner ; CAPTURES_PAGES=accueil pour ne refaire que ces pages) :
  uv run --with playwright python dev/scripts/captures.py              # tout, dans docs/captures/v1/
  uv run --with playwright python dev/scripts/captures.py famille      # une seule maison
  uv run --with playwright python dev/scripts/captures.py --anglais    # l'interface en anglais
La première fois : uv run --with playwright playwright install chromium

Les fichiers s'appellent {page}-{ordinateur|telephone}-{clair|sombre}.png, et
carte-{carte}-{clair|sombre}.png pour les cartes seules.
"""

from __future__ import annotations

import base64
import json
import os
import sys
import urllib.request
from dataclasses import dataclass, field
from pathlib import Path
from urllib.parse import urlencode

from playwright.sync_api import Page, sync_playwright

RACINE = Path(__file__).resolve().parents[2]
SORTIE = RACINE / "docs" / "captures" / "v1"
# Pour ne refaire que quelques pages : CAPTURES_PAGES=accueil (la page entière de l'accueil suit).
SEULEMENT = [p for p in os.environ.get("CAPTURES_PAGES", "").split(",") if p]
TABLEAU = "/automatic-essai"

APPAREILS = {
    "ordinateur": {"viewport": {"width": 1440, "height": 960}, "device_scale_factor": 2},
    "telephone": {
        "viewport": {"width": 390, "height": 844},
        "device_scale_factor": 3,
        "is_mobile": True,
        "has_touch": True,
    },
}
THEMES = {"clair": "light", "sombre": "dark"}

# Les cartes seules : (nom du fichier, page, balise de la carte).
CARTES = [
    ("ouverture", "accueil", "automatic-dashboard-ouverture"),
    ("points", "accueil", "automatic-dashboard-points"),
    ("pluie", "accueil", "automatic-dashboard-meteo-france"),
    ("moment", "accueil", "automatic-dashboard-moment"),
    ("piece", "accueil", "automatic-dashboard-piece"),
    ("apercu", "accueil", "automatic-dashboard-apercu"),
    ("heros-climat", "climat", "automatic-dashboard-heros"),
    ("confort", "climat", "automatic-dashboard-confort"),
    ("heros-systeme", "systeme", "automatic-dashboard-heros"),
    ("a-ranger", "a-ranger", "automatic-dashboard-heros"),
]


@dataclass
class Maison:
    nom: str
    adresse: str
    secrets: str
    pages: list[str]
    cartes: bool = False
    extras: list[str] = field(default_factory=list)


MAISONS = [
    Maison(
        "famille",
        "http://127.0.0.1:8123",
        "identifiants.json",
        ["accueil", "climat", "energie", "securite", "systeme", "salon", "bilan", "tablette", "depart", "mes-favoris"],
        cartes=True,
        extras=["entier", "editeur", "native"],
    ),
    Maison("debutant", "http://127.0.0.1:8124", "debutant.json", ["accueil", "climat"], extras=["native"]),
    Maison(
        "complete",
        "http://127.0.0.1:8125",
        "complet.json",
        ["accueil", "energie", "securite", "exterieur"],
        extras=["native"],
    ),
]


def code_de_connexion(maison: Maison) -> str:
    """Le flux de connexion de Home Assistant : un code à usage unique, valable 10 minutes."""
    compte = json.loads((RACINE / "dev" / ".secrets" / maison.secrets).read_text())["proprietaire"]

    def poster(chemin: str, donnees: dict) -> dict:
        requete = urllib.request.Request(
            f"{maison.adresse}{chemin}",
            data=json.dumps(donnees).encode(),
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(requete) as reponse:
            return json.loads(reponse.read())

    client = f"{maison.adresse}/"
    flux = poster(
        "/auth/login_flow",
        {"client_id": client, "handler": ["homeassistant", None], "redirect_uri": f"{maison.adresse}{TABLEAU}"},
    )
    fin = poster(
        f"/auth/login_flow/{flux['flow_id']}",
        {"client_id": client, "username": compte["utilisateur"], "password": compte["mot_de_passe"]},
    )
    return fin["result"]


def attendre(page: Page) -> None:
    """Attend que Home Assistant ait dessiné la vue, puis que les courbes soient arrivées."""
    page.wait_for_function("() => document.querySelector('home-assistant')?.hass?.states", timeout=30000)
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(3000)


def aller(page: Page, maison: Maison, chemin: str) -> None:
    page.goto(f"{maison.adresse}{chemin}")
    attendre(page)


def connecter(page: Page, maison: Maison) -> None:
    etat = base64.b64encode(json.dumps({"hassUrl": maison.adresse, "clientId": f"{maison.adresse}/"}).encode()).decode()
    connexion = {"auth_callback": 1, "code": code_de_connexion(maison), "state": etat, "storeToken": "true"}
    aller(page, maison, f"{TABLEAU}/accueil?{urlencode(connexion)}")


def capturer(maison: Maison, anglais: bool) -> None:
    dossier = SORTIE / (f"{maison.nom}-en" if anglais else maison.nom)
    dossier.mkdir(parents=True, exist_ok=True)
    langue = "en" if anglais else "fr"

    def enregistrer(cible, nom: str) -> None:
        cible.screenshot(path=dossier / f"{nom}.png")
        print(f"{dossier.name}/{nom}.png", flush=True)

    with sync_playwright() as p:
        navigateur = p.chromium.launch()
        for appareil, options in APPAREILS.items():
            for theme, schema in THEMES.items():
                region = "en-US" if anglais else "fr-FR"
                contexte = navigateur.new_context(**options, color_scheme=schema, locale=region)
                # Langue de l'interface, et barre latérale repliée pour laisser toute la place au tableau.
                contexte.add_init_script(
                    f"localStorage.setItem('selectedLanguage', '\"{langue}\"');"
                    "localStorage.setItem('dockedSidebar', '\"always_hidden\"');"
                )
                page = contexte.new_page()
                connecter(page, maison)
                for vue in [v for v in maison.pages if not SEULEMENT or v in SEULEMENT]:
                    aller(page, maison, f"{TABLEAU}/{vue}")
                    enregistrer(page, f"{vue}-{appareil}-{theme}")

                if appareil == "ordinateur" and maison.cartes and not SEULEMENT:
                    for nom, vue, balise in CARTES:
                        aller(page, maison, f"{TABLEAU}/{vue}")
                        carte = page.locator(f"{balise} >> visible=true").first
                        if carte.count():
                            enregistrer(carte, f"carte-{nom}-{theme}")

                if appareil == "ordinateur" and theme == "clair":
                    if "native" in maison.extras and not SEULEMENT:
                        # La vue d'ensemble que Home Assistant génère lui-même, pour la comparaison.
                        aller(page, maison, "/home")
                        enregistrer(page, "vue-native-ordinateur-clair")
                    if "editeur" in maison.extras and not SEULEMENT:
                        aller(page, maison, f"{TABLEAU}/accueil")
                        page.get_by_role("button", name="Modifier le tableau de bord").or_(
                            page.get_by_role("button", name="Edit dashboard")
                        ).first.click()
                        page.wait_for_timeout(2500)
                        enregistrer(page, "editeur-ordinateur-clair")
                        page.keyboard.press("Escape")
                    if "entier" in maison.extras:
                        page.set_viewport_size({"width": 1440, "height": 2000})
                        aller(page, maison, f"{TABLEAU}/accueil")
                        enregistrer(page, "accueil-ordinateur-entier")
                contexte.close()
        navigateur.close()


if __name__ == "__main__":
    noms = [a for a in sys.argv[1:] if not a.startswith("--")]
    anglais = "--anglais" in sys.argv
    for maison in MAISONS:
        if not noms or maison.nom in noms:
            capturer(maison, anglais)
