"""Prépare le Home Assistant d'essai d'Automatic Dashboard, sans clic.

- crée le compte propriétaire (administrateur) et un compte « famille » sans droits d'administration ;
- règle la France (langue, pays, fuseau, euro, système métrique) ;
- ajoute l'intégration Automatic Dashboard et le tableau d'essai (/automatic-essai) ;
- écrit les identifiants et les jetons dans dev/.secrets/identifiants.json (mode 600),
  sans jamais les afficher.

Usage : python3 dev/scripts/preparer.py
"""

from __future__ import annotations

import asyncio
import json
import os
import secrets
from pathlib import Path

import aiohttp

# Par défaut, la maison « famille » (port 8123). Pour la maison « débutant » :
# AUTOMATIC_HA=http://127.0.0.1:8124 AUTOMATIC_SECRETS=dev/.secrets/debutant.json
TABLEAU = "automatic-essai"
BASE = os.environ.get("AUTOMATIC_HA", "http://127.0.0.1:8123")
CLIENT_ID = f"{BASE}/"
SECRETS = Path(
    os.environ.get(
        "AUTOMATIC_SECRETS",
        Path(__file__).resolve().parent.parent / ".secrets" / "identifiants.json",
    )
).resolve()


class WS:
    """Petit client WebSocket de Home Assistant."""

    def __init__(self, session: aiohttp.ClientSession, jeton: str) -> None:
        self.session, self.jeton, self.n = session, jeton, 0

    async def __aenter__(self) -> WS:
        self.ws = await self.session.ws_connect(f"{BASE}/api/websocket")
        await self.ws.receive_json()
        await self.ws.send_json({"type": "auth", "access_token": self.jeton})
        reponse = await self.ws.receive_json()
        if reponse["type"] != "auth_ok":
            raise RuntimeError(f"Authentification refusée : {reponse}")
        return self

    async def __aexit__(self, *_: object) -> None:
        await self.ws.close()

    async def appel(self, type_: str, **donnees: object) -> dict:
        self.n += 1
        await self.ws.send_json({"id": self.n, "type": type_, **donnees})
        while True:
            message = await self.ws.receive_json()
            if message.get("id") == self.n and message["type"] == "result":
                return message


async def jeton_depuis_code(session: aiohttp.ClientSession, code: str) -> str:
    async with session.post(
        f"{BASE}/auth/token",
        data={"grant_type": "authorization_code", "code": code, "client_id": CLIENT_ID},
    ) as r:
        r.raise_for_status()
        return (await r.json())["access_token"]


async def connexion(session: aiohttp.ClientSession, utilisateur: str, mot_de_passe: str) -> str:
    async with session.post(
        f"{BASE}/auth/login_flow",
        json={"client_id": CLIENT_ID, "handler": ["homeassistant", None], "redirect_uri": CLIENT_ID},
    ) as r:
        flux = await r.json()
    async with session.post(
        f"{BASE}/auth/login_flow/{flux['flow_id']}",
        json={"client_id": CLIENT_ID, "username": utilisateur, "password": mot_de_passe},
    ) as r:
        resultat = await r.json()
    return await jeton_depuis_code(session, resultat["result"])


async def main() -> None:
    if SECRETS.exists():
        raise SystemExit(f"{SECRETS} existe déjà : Home Assistant est déjà préparé.")

    proprietaire = {"nom": "Antonin (essai)", "utilisateur": "essai-admin", "mot_de_passe": secrets.token_urlsafe(18)}
    famille = {"nom": "Famille (essai)", "utilisateur": "essai-famille", "mot_de_passe": secrets.token_urlsafe(18)}

    async with aiohttp.ClientSession() as session:
        # 1. Compte propriétaire
        async with session.post(
            f"{BASE}/api/onboarding/users",
            json={
                "client_id": CLIENT_ID,
                "name": proprietaire["nom"],
                "username": proprietaire["utilisateur"],
                "password": proprietaire["mot_de_passe"],
                "language": "fr",
            },
        ) as r:
            r.raise_for_status()
            code = (await r.json())["auth_code"]
        jeton = await jeton_depuis_code(session, code)
        entetes = {"Authorization": f"Bearer {jeton}"}

        # 2. Fin de l'accueil de Home Assistant
        for etape, donnees in (
            ("core_config", {}),
            ("analytics", {}),
            ("integration", {"client_id": CLIENT_ID, "redirect_uri": CLIENT_ID}),
        ):
            async with session.post(f"{BASE}/api/onboarding/{etape}", json=donnees, headers=entetes) as r:
                r.raise_for_status()

        async with WS(session, jeton) as ws:
            # 3. Réglages pour la France
            await ws.appel(
                "config/core/update",
                country="FR",
                language="fr",
                time_zone="Europe/Paris",
                currency="EUR",
                unit_system="metric",
                location_name="Maison d'essai",
            )
            proprietaire["jeton"] = (
                await ws.appel("auth/long_lived_access_token", client_name="Essais Automatic Dashboard", lifespan=365)
            )["result"]

            # 4. Compte famille, sans droits d'administration
            cree = await ws.appel(
                "config/auth/create", name=famille["nom"], group_ids=["system-users"], local_only=False
            )
            await ws.appel(
                "config/auth_provider/homeassistant/create",
                user_id=cree["result"]["user"]["id"],
                username=famille["utilisateur"],
                password=famille["mot_de_passe"],
            )

        jeton_famille = await connexion(session, famille["utilisateur"], famille["mot_de_passe"])
        async with WS(session, jeton_famille) as ws:
            famille["jeton"] = (
                await ws.appel("auth/long_lived_access_token", client_name="Essais Automatic Dashboard", lifespan=365)
            )["result"]

        # 5. Intégration Automatic Dashboard, ajoutée comme le ferait un utilisateur
        entetes = {"Authorization": f"Bearer {proprietaire['jeton']}"}
        async with session.post(
            f"{BASE}/api/config/config_entries/flow", json={"handler": "automatic_dashboard"}, headers=entetes
        ) as r:
            flux = await r.json()
        # Le tableau d'essai est créé plus bas, à son adresse : l'intégration n'en crée pas d'autre.
        async with session.post(
            f"{BASE}/api/config/config_entries/flow/{flux['flow_id']}",
            json={"creer_tableau": False, "par_defaut": False},
            headers=entetes,
        ) as r:
            fin = await r.json()

        # 6. Le tableau d'essai, comme l'utilisateur le crée (Tableaux de bord, Ajouter, Automatic Dashboard)
        async with WS(session, proprietaire["jeton"]) as ws:
            await ws.appel(
                "lovelace/dashboards/create",
                url_path=TABLEAU,
                title="Automatic Dashboard",
                icon="mdi:home-roof",
                show_in_sidebar=True,
                require_admin=False,
            )
            strategie = {"strategy": {"type": "custom:automatic-dashboard"}}
            await ws.appel("lovelace/config/save", url_path=TABLEAU, config=strategie)

    SECRETS.parent.mkdir(mode=0o700, exist_ok=True)
    SECRETS.write_text(json.dumps({"proprietaire": proprietaire, "famille": famille}, indent=2))
    os.chmod(SECRETS, 0o600)
    print(
        f"Comptes créés : {proprietaire['utilisateur']} (administrateur), "
        f"{famille['utilisateur']} (famille). Identifiants dans {SECRETS}."
    )
    print(f"Intégration Automatic Dashboard : {fin.get('type')} ({fin.get('title', fin.get('reason'))})")


if __name__ == "__main__":
    asyncio.run(main())
