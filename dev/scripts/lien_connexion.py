"""Donne un lien qui ouvre le tableau d'une maison d'essai déjà connecté, sans taper
de mot de passe : le script se connecte lui-même avec le compte de dev/.secrets/ et
rend un code à usage unique (valable 10 minutes), jamais le mot de passe ni le jeton.
La session reste ouverte dans ce navigateur (« Rester connecté »).

Usage :
  python3 dev/scripts/lien_connexion.py              # compte administrateur
  python3 dev/scripts/lien_connexion.py famille      # compte sans droits d'administration
"""

from __future__ import annotations

import asyncio
import base64
import json
import sys
from pathlib import Path
from urllib.parse import urlencode

import aiohttp

sys.path.insert(0, str(Path(__file__).resolve().parent))
from preparer import BASE, CLIENT_ID, SECRETS

PAGE = "/automatic-essai/accueil"


async def lien(compte: str) -> str:
    identifiants = json.loads(SECRETS.read_text())[compte]
    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{BASE}/auth/login_flow",
            json={"client_id": CLIENT_ID, "handler": ["homeassistant", None], "redirect_uri": f"{BASE}{PAGE}"},
        ) as r:
            flux = await r.json()
        async with session.post(
            f"{BASE}/auth/login_flow/{flux['flow_id']}",
            json={
                "client_id": CLIENT_ID,
                "username": identifiants["utilisateur"],
                "password": identifiants["mot_de_passe"],
            },
        ) as r:
            code = (await r.json())["result"]
    # L'interface relit l'adresse et l'identifiant du client dans « state » (JSON en base 64).
    etat = base64.b64encode(json.dumps({"hassUrl": BASE, "clientId": CLIENT_ID}).encode()).decode()
    return f"{BASE}{PAGE}?{urlencode({'auth_callback': 1, 'code': code, 'state': etat, 'storeToken': 'true'})}"


if __name__ == "__main__":
    print(asyncio.run(lien(sys.argv[1] if len(sys.argv) > 1 else "proprietaire")))
