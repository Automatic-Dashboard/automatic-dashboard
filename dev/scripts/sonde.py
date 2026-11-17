"""La sonde : ouvre le tableau dans un vrai navigateur et vérifie qu'il marche.

Elle sert au flux « Bêta de Home Assistant » (.github/workflows/beta.yml), qui la lance
chaque semaine sur la bêta et la version de développement, pour voir une casse avant les
utilisateurs. Elle marche aussi sur les maisons d'essai.

Pour chaque page du tableau, en français puis en anglais :
- le fichier du tableau est chargé (sa version est connue) ;
- la page est dessinée, sans carte en erreur ni exception dans la console ;
- l'accueil a ses cartes Automatic Dashboard.
Puis l'éditeur des réglages s'ouvre et montre ses rubriques.

En cas d'échec, une capture de chaque page fautive est écrite dans le dossier de sortie.

Usage :
  AUTOMATIC_HA=http://127.0.0.1:8123 AUTOMATIC_SECRETS=dev/.secrets/identifiants.json \\
    uv run --with playwright python dev/scripts/sonde.py [dossier-de-sortie]
"""

from __future__ import annotations

import base64
import json
import sys
import urllib.request
from pathlib import Path
from urllib.parse import urlencode

from playwright.sync_api import Page, sync_playwright

sys.path.insert(0, str(Path(__file__).resolve().parent))
from preparer import BASE, SECRETS, TABLEAU

SORTIE = Path(sys.argv[1] if len(sys.argv) > 1 else "sonde")

# Cherche dans tous les arbres fantômes (shadow DOM) de Home Assistant.
CHERCHER = """
(selecteur) => {
  const tous = [];
  const parcourir = (racine) => {
    tous.push(...racine.querySelectorAll(selecteur));
    for (const el of racine.querySelectorAll('*')) if (el.shadowRoot) parcourir(el.shadowRoot);
  };
  parcourir(document);
  return tous.length;
}
"""
# Le premier élément d'un sélecteur, dans tous les arbres fantômes.
PREMIER = """
const premier = (racine, selecteur) => {
  const trouve = racine.querySelector(selecteur);
  if (trouve) return trouve;
  for (const el of racine.querySelectorAll('*')) {
    if (el.shadowRoot) {
      const x = premier(el.shadowRoot, selecteur);
      if (x) return x;
    }
  }
  return null;
};
"""
VUES = (
    "() => {"
    + PREMIER
    + "return (premier(document, 'ha-panel-lovelace')?.lovelace?.config?.views ?? []).map((v) => v.path); }"
)
RUBRIQUES = (
    "() => {" + PREMIER + "const e = premier(document, 'automatic-dashboard-editeur');"
    "return e ? [...e.shadowRoot.querySelectorAll('h3')].map((h) => h.textContent) : null; }"
)


def code_de_connexion() -> str:
    compte = json.loads(SECRETS.read_text())["proprietaire"]

    def poster(chemin: str, donnees: dict) -> dict:
        requete = urllib.request.Request(
            f"{BASE}{chemin}", data=json.dumps(donnees).encode(), headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(requete) as reponse:
            return json.loads(reponse.read())

    flux = poster(
        "/auth/login_flow", {"client_id": f"{BASE}/", "handler": ["homeassistant", None], "redirect_uri": f"{BASE}/"}
    )
    fin = poster(
        f"/auth/login_flow/{flux['flow_id']}",
        {"client_id": f"{BASE}/", "username": compte["utilisateur"], "password": compte["mot_de_passe"]},
    )
    return fin["result"]


def attendre(page: Page) -> None:
    page.wait_for_function("() => document.querySelector('home-assistant')?.hass?.states", timeout=60000)
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2500)


def sonder(langue: str) -> list[str]:
    erreurs: list[str] = []
    with sync_playwright() as p:
        navigateur = p.chromium.launch()
        contexte = navigateur.new_context(viewport={"width": 1440, "height": 1000}, locale=f"{langue}-FR")
        contexte.add_init_script(f"localStorage.setItem('selectedLanguage', '\"{langue}\"');")
        page = contexte.new_page()
        console: list[str] = []
        page.on("console", lambda m: console.append(m.text) if m.type == "error" else None)
        page.on("pageerror", lambda e: console.append(f"exception : {e}"))

        etat = base64.b64encode(json.dumps({"hassUrl": BASE, "clientId": f"{BASE}/"}).encode()).decode()
        connexion = {"auth_callback": 1, "code": code_de_connexion(), "state": etat, "storeToken": "true"}
        page.goto(f"{BASE}/{TABLEAU}/accueil?{urlencode(connexion)}")
        attendre(page)

        version = page.evaluate("() => window.__automaticDashboard?.version")
        if not version:
            erreurs.append(f"[{langue}] le fichier du tableau n'est pas chargé")
        vues = page.evaluate(VUES)
        if not vues or vues[0] != "accueil":
            erreurs.append(f"[{langue}] le tableau n'a pas été généré (pages : {vues})")
        print(f"[{langue}] Automatic Dashboard {version}, pages : {', '.join(vues)}", flush=True)

        for vue in vues:
            console.clear()
            page.goto(f"{BASE}/{TABLEAU}/{vue}")
            attendre(page)
            fautes = []
            if page.evaluate(CHERCHER, "hui-error-card") or page.evaluate(CHERCHER, "hui-warning"):
                fautes.append("carte en erreur")
            if vue == "accueil" and not page.evaluate(CHERCHER, "automatic-dashboard-ouverture"):
                fautes.append("en-tête de l'accueil absent")
            # Les erreurs de Home Assistant sans rapport avec le tableau (intégrations de démonstration) sont ignorées.
            fautes += [m for m in console if "automatic" in m.lower() or m.startswith("exception")]
            if fautes:
                SORTIE.mkdir(parents=True, exist_ok=True)
                page.screenshot(path=SORTIE / f"{vue}-{langue}.png", full_page=True)
                erreurs += [f"[{langue}] {vue} : {f}" for f in fautes]
            print(f"[{langue}] {vue} : {'ÉCHEC' if fautes else 'ok'}", flush=True)

        # L'éditeur des réglages, qui s'appuie sur des composants internes de Home Assistant.
        page.goto(f"{BASE}/{TABLEAU}/accueil")
        attendre(page)
        page.get_by_role("button", name="Modifier le tableau de bord").or_(
            page.get_by_role("button", name="Edit dashboard")
        ).first.click()
        page.wait_for_timeout(3000)
        rubriques = page.evaluate(RUBRIQUES)
        if not rubriques or len(rubriques) < 5:
            SORTIE.mkdir(parents=True, exist_ok=True)
            page.screenshot(path=SORTIE / f"editeur-{langue}.png")
            erreurs.append(f"[{langue}] l'éditeur des réglages ne s'ouvre pas (rubriques : {rubriques})")
        print(f"[{langue}] éditeur : {'ok' if rubriques and len(rubriques) >= 5 else 'ÉCHEC'}", flush=True)
        navigateur.close()
    return erreurs


def main() -> None:
    erreurs = sonder("fr") + sonder("en")
    if erreurs:
        print("\n".join(["", "La sonde a trouvé des problèmes :", *erreurs]))
        raise SystemExit(1)
    print("\nLe tableau marche, en français et en anglais.")


if __name__ == "__main__":
    main()
