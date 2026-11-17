"""Ajoute la vie de tous les jours à une maison d'essai, pour le bloc « En ce moment »
et les blocs de Météo-France.

- Toutes les maisons : Météo-France, pour la commune de la maison (pluie dans l'heure
  et vigilance ; il faut que Home Assistant puisse joindre internet).
- Maison famille seulement : deux personnes avec un traceur (une à la maison, une
  dehors), l'agenda « Maison » avec trois rendez-vous, trois articles dans la liste de
  courses, l'enceinte du salon et le lave-linge rangés dans leur pièce.

Usage : python3 dev/scripts/vie_quotidienne.py (peut être relancé sans risque)
"""

from __future__ import annotations

import asyncio
import json
import sys
from datetime import datetime, timedelta
from pathlib import Path

import aiohttp

sys.path.insert(0, str(Path(__file__).resolve().parent))
from preparer import BASE, SECRETS, WS

COMMUNE = "Marseille"


async def flux(session: aiohttp.ClientSession, entetes: dict, domaine: str, etapes: list[dict]) -> dict:
    """Mène un flux de configuration ; une étape de choix de commune prend la première proposée."""
    async with session.post(f"{BASE}/api/config/config_entries/flow", json={"handler": domaine}, headers=entetes) as r:
        etape = await r.json()
    for donnees in etapes:
        if etape.get("type") != "form":
            break
        if etape.get("step_id") == "cities":
            options = etape["data_schema"][0].get("options") or etape["data_schema"][0].get("selector", {}).get(
                "select", {}
            ).get("options")
            premiere = options[0]
            donnees = {"city": premiere[0] if isinstance(premiere, list) else premiere}
        async with session.post(
            f"{BASE}/api/config/config_entries/flow/{etape['flow_id']}", json=donnees, headers=entetes
        ) as r:
            etape = await r.json()
    return etape


async def service(
    session: aiohttp.ClientSession, entetes: dict, nom: str, donnees: dict, reponse: bool = False
) -> dict:
    domaine, action = nom.split(".")
    url = f"{BASE}/api/services/{domaine}/{action}" + ("?return_response" if reponse else "")
    async with session.post(url, json=donnees, headers=entetes) as r:
        r.raise_for_status()
        return await r.json()


async def main() -> None:
    jeton = json.loads(SECRETS.read_text())["proprietaire"]["jeton"]
    entetes = {"Authorization": f"Bearer {jeton}"}
    async with aiohttp.ClientSession() as session, WS(session, jeton) as ws:
        entrees = (await ws.appel("config_entries/get"))["result"]
        domaines = {e["domain"] for e in entrees}
        fait: list[str] = []

        if "meteo_france" not in domaines:
            fin = await flux(session, entetes, "meteo_france", [{"city": COMMUNE}, {}])
            fait.append(f"Météo-France : {fin.get('title') or fin.get('reason') or fin}")

        etats = {e["entity_id"]: e for e in (await ws.appel("get_states"))["result"]}
        if "media_player.enceinte_du_salon" not in etats:
            print("\n".join(fait) or "Rien à faire.")
            return

        # Les appareils de la maison famille, dans leur pièce.
        for entity_id, piece in {
            "media_player.enceinte_du_salon": "salon",
            "binary_sensor.lave_linge": "salle_de_bain",
        }.items():
            await ws.appel("config/entity_registry/update", entity_id=entity_id, area_id=piece)

        # Deux personnes suivies : l'une à la maison, l'autre dehors.
        personnes = {p["name"]: p for p in (await ws.appel("person/list"))["result"]["storage"]}
        proprietaire = next(p for p in personnes.values() if p.get("user_id"))
        await ws.appel(
            "person/update",
            person_id=proprietaire["id"],
            name=proprietaire["name"],
            user_id=proprietaire["user_id"],
            device_trackers=["device_tracker.demo_home_boy"],
            picture=None,
        )
        if "Camille" not in personnes:
            await ws.appel("person/create", name="Camille", device_trackers=["device_tracker.demo_paulus"])
            fait.append("Camille ajoutée")

        # L'agenda de la maison et ses rendez-vous.
        if "local_calendar" not in domaines:
            await flux(session, entetes, "local_calendar", [{"calendar_name": "Maison"}])
            fait.append("Agenda « Maison » créé")
            await asyncio.sleep(1)
        agenda = "calendar.maison"
        maintenant = datetime.now().astimezone()
        evenements = await service(
            session,
            entetes,
            "calendar.get_events",
            {"entity_id": agenda, "duration": {"days": 7}},
            reponse=True,
        )
        if not evenements["service_response"][agenda]["events"]:
            debut = (maintenant + timedelta(hours=1)).replace(minute=30, second=0, microsecond=0)
            demain = (maintenant + timedelta(days=1)).replace(hour=8, minute=30, second=0, microsecond=0)
            apres = (maintenant + timedelta(days=2)).date()
            for donnees in (
                {
                    "summary": "Cours de piano",
                    "start_date_time": debut.isoformat(),
                    "end_date_time": (debut + timedelta(hours=1)).isoformat(),
                },
                {
                    "summary": "Dentiste",
                    "start_date_time": demain.isoformat(),
                    "end_date_time": (demain + timedelta(minutes=45)).isoformat(),
                },
                {
                    "summary": "Encombrants",
                    "start_date": apres.isoformat(),
                    "end_date": (apres + timedelta(days=1)).isoformat(),
                },
            ):
                await service(session, entetes, "calendar.create_event", {"entity_id": agenda, **donnees})
            fait.append("3 rendez-vous ajoutés")

        # La liste de courses.
        if etats.get("todo.shopping_list", {}).get("state") == "0":
            for article in ("Lait", "Pain", "Café"):
                await service(session, entetes, "todo.add_item", {"entity_id": "todo.shopping_list", "item": article})
            fait.append("3 articles dans la liste de courses")

    print("\n".join(fait) or "Rien à faire.")


if __name__ == "__main__":
    asyncio.run(main())
