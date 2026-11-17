"""Exporte une maison d'essai sous la forme exacte de l'objet `hass` du navigateur
(états, entités, appareils, pièces, étages), pour les tests du moteur de tri.

Usage :
  python3 dev/scripts/exporter_maison.py famille
  AUTOMATIC_HA=http://127.0.0.1:8124 AUTOMATIC_SECRETS=$PWD/dev/.secrets/debutant.json \
    python3 dev/scripts/exporter_maison.py debutant

Écrit frontend/tests/fixtures/<nom>.json. Aucun jeton ni mot de passe n'y est copié.
"""

from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ws import appeler

RACINE = Path(__file__).resolve().parents[2]
CLES = {
    "ei": "entity_id",
    "pl": "platform",
    "lb": "labels",
    "di": "device_id",
    "ai": "area_id",
    "hb": "hidden",
    "en": "name",
    "tk": "translation_key",
    "ic": "icon",
    "dp": "display_precision",
    "np": "next_name_part",
}
CHAMPS_APPAREIL = (
    "id",
    "name",
    "name_by_user",
    "area_id",
    "parent_device_id",
    "entry_type",
    "manufacturer",
    "model",
    "via_device_id",
    "disabled_by",
    "labels",
)
CHAMPS_PIECE = (
    "area_id",
    "name",
    "icon",
    "floor_id",
    "temperature_entity_id",
    "humidity_entity_id",
    "labels",
    "aliases",
)
CHAMPS_ETAGE = ("floor_id", "name", "level", "icon")
# Jamais exportés : les jetons d'accès aux images et les positions des personnes.
ATTRIBUTS_PRIVES = {"entity_picture", "entity_picture_local", "access_token", "latitude", "longitude", "gps_accuracy"}


def public(cle: str, valeur: object) -> bool:
    """Un attribut qu'on peut verser dans le dépôt : ni privé, ni adresse qui porte un jeton."""
    return cle not in ATTRIBUTS_PRIVES and not (isinstance(valeur, str) and "token=" in valeur)


async def exporter(nom: str) -> Path:
    async def lire(type_: str) -> object:
        reponse = await appeler("proprietaire", type_, {})
        if not reponse.get("success"):
            raise RuntimeError(f"{type_} : {reponse.get('error')}")
        return reponse["result"]

    etats = await lire("get_states")
    affichage = await lire("config/entity_registry/list_for_display")
    appareils = await lire("config/device_registry/list")
    pieces = await lire("config/area_registry/list")
    etages = await lire("config/floor_registry/list")
    config = await lire("get_config")

    categories = affichage["entity_categories"]
    entites = {}
    for brut in affichage["entities"]:
        e = {CLES[c]: v for c, v in brut.items() if c in CLES}
        if "ec" in brut:
            e["entity_category"] = categories[str(brut["ec"])]
        e["hidden"] = bool(e.get("hidden"))
        entites[e["entity_id"]] = e

    maison = {
        "config": {
            c: config.get(c)
            for c in (
                "location_name",
                "latitude",
                "longitude",
                "country",
                "language",
                "time_zone",
                "version",
                "components",
                "unit_system",
            )
        },
        "states": {
            s["entity_id"]: {
                "entity_id": s["entity_id"],
                "state": s["state"],
                "attributes": {k: v for k, v in s["attributes"].items() if public(k, v)},
            }
            for s in etats
        },
        "entities": entites,
        "devices": {a["id"]: {c: a.get(c) for c in CHAMPS_APPAREIL} for a in appareils},
        "areas": {p["area_id"]: {c: p.get(c) for c in CHAMPS_PIECE} for p in pieces},
        "floors": {f["floor_id"]: {c: f.get(c) for c in CHAMPS_ETAGE} for f in etages},
    }
    maison["config"]["components"] = sorted(maison["config"]["components"] or [])
    cible = RACINE / "frontend" / "tests" / "fixtures" / f"{nom}.json"
    cible.write_text(json.dumps(maison, ensure_ascii=False, indent=1, sort_keys=True) + "\n", encoding="utf-8")
    return cible


if __name__ == "__main__":
    fichier = asyncio.run(exporter(sys.argv[1]))
    donnees = json.loads(fichier.read_text(encoding="utf-8"))
    print(
        f"{fichier.name} : {len(donnees['states'])} états, {len(donnees['entities'])} entités, "
        f"{len(donnees['devices'])} appareils, {len(donnees['areas'])} pièces, {len(donnees['floors'])} étages"
    )
