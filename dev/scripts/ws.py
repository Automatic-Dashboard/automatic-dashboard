"""Appels WebSocket au Home Assistant d'essai, avec le jeton d'un des deux comptes.

Usage :
  python3 dev/scripts/ws.py proprietaire config/area_registry/list
  python3 dev/scripts/ws.py famille config/entity_registry/list
  python3 dev/scripts/ws.py proprietaire lovelace/dashboards/create '{"url_path": "x", "title": "X"}'
"""

from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path

import aiohttp

sys.path.insert(0, str(Path(__file__).resolve().parent))
from preparer import SECRETS, WS


async def appeler(compte: str, type_: str, donnees: dict) -> dict:
    jeton = json.loads(SECRETS.read_text())[compte]["jeton"]
    async with aiohttp.ClientSession() as session, WS(session, jeton) as ws:
        return await ws.appel(type_, **donnees)


if __name__ == "__main__":
    compte, type_ = sys.argv[1], sys.argv[2]
    donnees = json.loads(sys.argv[3]) if len(sys.argv) > 3 else {}
    print(json.dumps(asyncio.run(appeler(compte, type_, donnees)), ensure_ascii=False, indent=1))
