"""Maison « complète » : ~75 appareils simulés, publiés par découverte MQTT comme le
ferait Zigbee2MQTT, avec leurs entités techniques (pile, qualité du lien, tension,
réglages, micrologiciel…), sur deux étages.

Usage, depuis le Mac :  python3 dev/scripts/maison_complete.py
Le script se relance lui-même dans le conteneur automatic-complet (qui a paho-mqtt)
pour publier, puis crée les étages par l'API de Home Assistant.
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ETAGES = {
    "Rez-de-chaussée": (
        0,
        "mdi:home-floor-0",
        ["Entrée", "Salon", "Salle à manger", "Cuisine", "Buanderie", "Garage", "Jardin"],
    ),
    "Étage": (
        1,
        "mdi:home-floor-1",
        ["Couloir", "Chambre parentale", "Chambre de Léa", "Chambre de Tom", "Salle de bain", "Bureau"],
    ),
}

MESSAGES: list[tuple[str, dict]] = []  # (sujet, contenu)


def appareil(ident: str, nom: str, piece: str, modele: str) -> dict:
    return {
        "identifiers": [f"simu_{ident}"],
        "name": nom,
        "manufacturer": "Simulé",
        "model": modele,
        "suggested_area": piece,
        "sw_version": "1.0.4",
    }


def entite(composant: str, ident: str, objet: str, dev: dict, **conf) -> None:
    conf.setdefault("state_topic", f"simu/{ident}")
    conf["unique_id"] = f"simu_{ident}_{objet}"
    conf["device"] = dev
    conf["object_id"] = f"{ident}_{objet}"
    MESSAGES.append((f"homeassistant/{composant}/{ident}/{objet}/config", conf))


def etat(ident: str, valeurs: dict) -> None:
    MESSAGES.append((f"simu/{ident}", valeurs))


def pile(ident, dev, niveau):
    entite(
        "sensor",
        ident,
        "pile",
        dev,
        name="Pile",
        device_class="battery",
        unit_of_measurement="%",
        state_class="measurement",
        entity_category="diagnostic",
        value_template="{{ value_json.battery }}",
    )
    return {"battery": niveau}


def lien(ident, dev):
    entite(
        "sensor",
        ident,
        "lien",
        dev,
        name="Qualité du lien",
        unit_of_measurement="lqi",
        icon="mdi:signal",
        state_class="measurement",
        entity_category="diagnostic",
        enabled_by_default=False,
        value_template="{{ value_json.linkquality }}",
    )
    return {"linkquality": 120}


def tension(ident, dev, volts):
    entite(
        "sensor",
        ident,
        "tension",
        dev,
        name="Tension",
        device_class="voltage",
        unit_of_measurement="V",
        state_class="measurement",
        entity_category="diagnostic",
        value_template="{{ value_json.voltage }}",
    )
    return {"voltage": volts}


def micrologiciel(ident, dev, nouvelle=False):
    entite(
        "update",
        ident,
        "micrologiciel",
        dev,
        name="Micrologiciel",
        device_class="firmware",
        entity_category="config",
        value_template="{{ value_json.firmware | tojson }}",
        latest_version_topic=f"simu/{ident}",
        latest_version_template="{{ value_json.firmware.latest_version }}",
    )
    return {"firmware": {"installed_version": "1.0.4", "latest_version": "1.1.0" if nouvelle else "1.0.4"}}


def thermometre(ident, piece, t, h):
    dev = appareil(ident, f"Thermomètre {piece.lower() if piece != 'Jardin' else 'extérieur'}", piece, "Capteur T/H")
    entite(
        "sensor",
        ident,
        "temperature",
        dev,
        name="Température",
        device_class="temperature",
        unit_of_measurement="°C",
        state_class="measurement",
        value_template="{{ value_json.temperature }}",
    )
    entite(
        "sensor",
        ident,
        "humidite",
        dev,
        name="Humidité",
        device_class="humidity",
        unit_of_measurement="%",
        state_class="measurement",
        value_template="{{ value_json.humidity }}",
    )
    entite(
        "sensor",
        ident,
        "pression",
        dev,
        name="Pression",
        device_class="atmospheric_pressure",
        unit_of_measurement="hPa",
        state_class="measurement",
        value_template="{{ value_json.pressure }}",
    )
    etat(
        ident,
        {
            "temperature": t,
            "humidity": h,
            "pressure": 1016,
            **pile(ident, dev, 87),
            **tension(ident, dev, 3.0),
            **lien(ident, dev),
        },
    )


def lumiere(ident, piece, nom, allumee, nouvelle=False):
    dev = appareil(ident, nom, piece, "Ampoule couleur")
    entite(
        "light",
        ident,
        "lumiere",
        dev,
        name=None,
        schema="json",
        command_topic=f"simu/{ident}/set",
        optimistic=True,
        brightness=True,
        supported_color_modes=["color_temp"],
    )
    etat(
        ident,
        {
            "state": "ON" if allumee else "OFF",
            "brightness": 180,
            **lien(ident, dev),
            **micrologiciel(ident, dev, nouvelle),
        },
    )


def prise(ident, piece, nom, watts, active=True):
    dev = appareil(ident, nom, piece, "Prise mesurée")
    entite(
        "switch",
        ident,
        "prise",
        dev,
        name=None,
        command_topic=f"simu/{ident}/set",
        optimistic=True,
        value_template="{{ value_json.state }}",
        payload_on="ON",
        payload_off="OFF",
        device_class="outlet",
    )
    entite(
        "sensor",
        ident,
        "puissance",
        dev,
        name="Puissance",
        device_class="power",
        unit_of_measurement="W",
        state_class="measurement",
        value_template="{{ value_json.power }}",
    )
    entite(
        "sensor",
        ident,
        "energie",
        dev,
        name="Énergie",
        device_class="energy",
        unit_of_measurement="kWh",
        state_class="total_increasing",
        value_template="{{ value_json.energy }}",
    )
    entite(
        "sensor",
        ident,
        "courant",
        dev,
        name="Courant",
        device_class="current",
        unit_of_measurement="A",
        state_class="measurement",
        entity_category="diagnostic",
        value_template="{{ value_json.current }}",
    )
    etat(
        ident,
        {
            "state": "ON" if active else "OFF",
            "power": watts,
            "energy": round(watts * 0.9 + 12.3, 2),
            "current": round(watts / 230, 2),
            **tension(ident, dev, 231),
            **lien(ident, dev),
        },
    )


def contact(ident, piece, nom, classe, ouvert=False, niveau=78):
    dev = appareil(ident, nom, piece, "Capteur d'ouverture")
    entite(
        "binary_sensor",
        ident,
        "contact",
        dev,
        name=None,
        device_class=classe,
        value_template="{{ 'ON' if not value_json.contact else 'OFF' }}",
    )
    etat(ident, {"contact": not ouvert, **pile(ident, dev, niveau), **tension(ident, dev, 2.9), **lien(ident, dev)})


def mouvement(ident, piece, presence=False):
    dev = appareil(ident, f"Détecteur de mouvement {piece.lower()}", piece, "Capteur de mouvement")
    entite(
        "binary_sensor",
        ident,
        "mouvement",
        dev,
        name=None,
        device_class="occupancy",
        value_template="{{ 'ON' if value_json.occupancy else 'OFF' }}",
    )
    entite(
        "sensor",
        ident,
        "luminosite",
        dev,
        name="Luminosité",
        device_class="illuminance",
        unit_of_measurement="lx",
        state_class="measurement",
        value_template="{{ value_json.illuminance }}",
    )
    etat(ident, {"occupancy": presence, "illuminance": 140, **pile(ident, dev, 64), **lien(ident, dev)})


def tete(ident, piece, consigne, mesure, mode="heat"):
    dev = appareil(ident, f"Tête thermostatique {piece.lower()}", piece, "Tête thermostatique")
    entite(
        "climate",
        ident,
        "chauffage",
        dev,
        name=None,
        modes=["off", "heat", "auto"],
        optimistic=True,
        mode_command_topic=f"simu/{ident}/mode",
        mode_state_topic=f"simu/{ident}",
        mode_state_template="{{ value_json.mode }}",
        temperature_command_topic=f"simu/{ident}/consigne",
        temperature_state_topic=f"simu/{ident}",
        temperature_state_template="{{ value_json.consigne }}",
        current_temperature_topic=f"simu/{ident}",
        current_temperature_template="{{ value_json.mesure }}",
        min_temp=5,
        max_temp=28,
        temp_step=0.5,
        temperature_unit="C",
    )
    entite(
        "switch",
        ident,
        "verrou_enfant",
        dev,
        name="Verrouillage enfant",
        entity_category="config",
        command_topic=f"simu/{ident}/verrou",
        optimistic=True,
        value_template="{{ value_json.verrou }}",
        payload_on="ON",
        payload_off="OFF",
    )
    entite(
        "switch",
        ident,
        "fenetre_ouverte",
        dev,
        name="Détection de fenêtre ouverte",
        entity_category="config",
        command_topic=f"simu/{ident}/fenetre",
        optimistic=True,
        value_template="{{ value_json.fenetre }}",
        payload_on="ON",
        payload_off="OFF",
    )
    entite(
        "number",
        ident,
        "calibration",
        dev,
        name="Calibration",
        entity_category="config",
        min=-5,
        max=5,
        step=0.5,
        unit_of_measurement="°C",
        command_topic=f"simu/{ident}/calibration",
        optimistic=True,
        value_template="{{ value_json.calibration }}",
    )
    etat(
        ident,
        {
            "mode": mode,
            "consigne": consigne,
            "mesure": mesure,
            "verrou": "OFF",
            "fenetre": "ON",
            "calibration": 0,
            **pile(ident, dev, 71),
            **lien(ident, dev),
        },
    )


def volet(ident, piece, position):
    dev = appareil(ident, f"Volet {piece.lower()}", piece, "Volet roulant")
    entite(
        "cover",
        ident,
        "volet",
        dev,
        name=None,
        device_class="shutter",
        command_topic=f"simu/{ident}/set",
        position_topic=f"simu/{ident}",
        position_template="{{ value_json.position }}",
        set_position_topic=f"simu/{ident}/position",
        optimistic=True,
    )
    etat(ident, {"position": position, **lien(ident, dev)})


def fuite(ident, piece):
    dev = appareil(ident, f"Détecteur de fuite {piece.lower()}", piece, "Détecteur de fuite")
    entite(
        "binary_sensor",
        ident,
        "fuite",
        dev,
        name=None,
        device_class="moisture",
        value_template="{{ 'ON' if value_json.water_leak else 'OFF' }}",
    )
    etat(ident, {"water_leak": False, **pile(ident, dev, 92), **lien(ident, dev)})


def fumee(ident, piece):
    dev = appareil(ident, f"Détecteur de fumée {piece.lower()}", piece, "Détecteur de fumée")
    entite(
        "binary_sensor",
        ident,
        "fumee",
        dev,
        name=None,
        device_class="smoke",
        value_template="{{ 'ON' if value_json.smoke else 'OFF' }}",
    )
    entite(
        "button",
        ident,
        "test",
        dev,
        name="Test de l'alarme",
        entity_category="config",
        command_topic=f"simu/{ident}/test",
    )
    etat(ident, {"smoke": False, **pile(ident, dev, 100), **lien(ident, dev)})


def compteur():
    ident = "linky"
    dev = appareil(ident, "Compteur Linky", "Garage", "Lecteur TIC")
    entite(
        "sensor",
        ident,
        "puissance",
        dev,
        name="Puissance apparente",
        device_class="apparent_power",
        unit_of_measurement="VA",
        state_class="measurement",
        value_template="{{ value_json.papp }}",
    )
    entite(
        "sensor",
        ident,
        "index_hc",
        dev,
        name="Index heures creuses",
        device_class="energy",
        unit_of_measurement="kWh",
        state_class="total_increasing",
        value_template="{{ value_json.hchc }}",
    )
    entite(
        "sensor",
        ident,
        "index_hp",
        dev,
        name="Index heures pleines",
        device_class="energy",
        unit_of_measurement="kWh",
        state_class="total_increasing",
        value_template="{{ value_json.hchp }}",
    )
    entite(
        "sensor",
        ident,
        "tarif",
        dev,
        name="Période tarifaire",
        icon="mdi:clock-outline",
        value_template="{{ value_json.ptec }}",
    )
    etat(ident, {"papp": 1840, "hchc": 18234.5, "hchp": 24781.2, "ptec": "Heures pleines"})


def solaire():
    ident = "solaire"
    dev = appareil(ident, "Panneaux solaires", "Jardin", "Micro-onduleurs")
    entite(
        "sensor",
        ident,
        "production",
        dev,
        name="Production",
        device_class="power",
        unit_of_measurement="W",
        state_class="measurement",
        value_template="{{ value_json.power }}",
    )
    entite(
        "sensor",
        ident,
        "energie",
        dev,
        name="Énergie produite",
        device_class="energy",
        unit_of_measurement="kWh",
        state_class="total_increasing",
        value_template="{{ value_json.energy }}",
    )
    etat(ident, {"power": 640, "energy": 3150.7})


def serrure():
    ident = "serrure"
    dev = appareil(ident, "Serrure de la porte d'entrée", "Entrée", "Serrure connectée")
    entite(
        "lock",
        ident,
        "serrure",
        dev,
        name=None,
        command_topic=f"simu/{ident}/set",
        optimistic=True,
        value_template="{{ value_json.state }}",
        state_locked="LOCK",
        state_unlocked="UNLOCK",
    )
    etat(ident, {"state": "LOCK", **pile(ident, dev, 55), **lien(ident, dev)})


def construire() -> None:
    temperatures = {
        "Entrée": 19.1,
        "Salon": 20.8,
        "Salle à manger": 20.4,
        "Cuisine": 21.3,
        "Buanderie": 17.6,
        "Garage": 13.2,
        "Jardin": 14.6,
        "Couloir": 19.0,
        "Chambre parentale": 18.4,
        "Chambre de Léa": 19.6,
        "Chambre de Tom": 17.9,
        "Salle de bain": 22.1,
        "Bureau": 19.8,
    }
    for i, (piece, t) in enumerate(temperatures.items()):
        thermometre(f"th{i}", piece, t, 48 + (i * 7) % 20)

    lumieres = [
        ("Entrée", "Plafonnier de l'entrée", True),
        ("Salon", "Lampadaire", True),
        ("Salon", "Plafonnier du salon", False),
        ("Salon", "Ruban LED du meuble TV", True),
        ("Salle à manger", "Suspension", True),
        ("Cuisine", "Spots de la cuisine", True),
        ("Cuisine", "Réglette du plan de travail", False),
        ("Couloir", "Applique du couloir", False),
        ("Chambre parentale", "Lampe de chevet gauche", False),
        ("Chambre parentale", "Lampe de chevet droite", False),
        ("Chambre de Léa", "Veilleuse de Léa", True),
        ("Chambre de Tom", "Plafonnier de Tom", False),
        ("Salle de bain", "Miroir lumineux", False),
        ("Bureau", "Lampe de bureau", True),
        ("Jardin", "Guirlande de la terrasse", False),
        ("Garage", "Néon du garage", False),
    ]
    for i, (piece, nom, allumee) in enumerate(lumieres):
        lumiere(f"lu{i}", piece, nom, allumee, nouvelle=i in (2, 9))

    prises = [
        ("Salon", "Prise de la télévision", 86),
        ("Buanderie", "Prise du lave-linge", 1950),
        ("Cuisine", "Prise du lave-vaisselle", 0),
        ("Buanderie", "Prise du sèche-linge", 0),
        ("Cuisine", "Prise du réfrigérateur", 112),
        ("Bureau", "Prise de la box internet", 14),
        ("Bureau", "Prise de l'ordinateur", 145),
        ("Garage", "Prise du chauffe-eau", 0),
    ]
    for i, (piece, nom, w) in enumerate(prises):
        prise(f"pr{i}", piece, nom, w, active=w > 0 or i == 7)

    contacts = [
        ("Entrée", "Porte d'entrée", "door", False),
        ("Salon", "Baie vitrée", "door", False),
        ("Salon", "Fenêtre du salon", "window", False),
        ("Cuisine", "Fenêtre de la cuisine", "window", False),
        ("Chambre parentale", "Fenêtre de la chambre parentale", "window", False),
        ("Chambre de Léa", "Fenêtre de Léa", "window", False),
        ("Chambre de Tom", "Fenêtre de Tom", "window", True),
        ("Salle de bain", "Fenêtre de la salle de bain", "window", False),
        ("Garage", "Porte du garage", "garage_door", False),
        ("Bureau", "Fenêtre du bureau", "window", False),
    ]
    for i, (piece, nom, classe, ouvert) in enumerate(contacts):
        contact(f"co{i}", piece, nom, classe, ouvert, niveau=9 if i == 8 else 78)

    for i, (piece, presence) in enumerate(
        [
            ("Entrée", False),
            ("Salon", True),
            ("Cuisine", False),
            ("Couloir", False),
            ("Bureau", True),
            ("Garage", False),
        ]
    ):
        mouvement(f"mo{i}", piece, presence)

    for i, (piece, consigne, mesure) in enumerate(
        [
            ("Salon", 20.5, 20.8),
            ("Salle à manger", 20, 20.4),
            ("Chambre parentale", 18, 18.4),
            ("Chambre de Léa", 19.5, 19.6),
            ("Chambre de Tom", 19, 17.9),
            ("Salle de bain", 22, 22.1),
        ]
    ):
        tete(f"tt{i}", piece, consigne, mesure)

    for i, (piece, pos) in enumerate(
        [
            ("Salon", 100),
            ("Salle à manger", 100),
            ("Cuisine", 60),
            ("Chambre parentale", 0),
            ("Chambre de Léa", 30),
            ("Chambre de Tom", 100),
            ("Bureau", 100),
            ("Salle de bain", 0),
        ]
    ):
        volet(f"vo{i}", piece, pos)

    for i, piece in enumerate(["Cuisine", "Salle de bain", "Buanderie"]):
        fuite(f"fu{i}", piece)
    for i, piece in enumerate(["Couloir", "Salon"]):
        fumee(f"fm{i}", piece)
    compteur()
    solaire()
    serrure()


def publier() -> None:
    import paho.mqtt.client as mqtt  # disponible dans l'image de Home Assistant

    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id="simulateur-automatic")
    client.connect("mosquitto", 1883)
    client.loop_start()
    # D'abord toutes les configurations, puis les états, retenus par le courtier.
    for sujet, contenu in sorted(MESSAGES, key=lambda m: not m[0].startswith("homeassistant/")):
        client.publish(sujet, json.dumps(contenu, ensure_ascii=False), qos=1, retain=True).wait_for_publish()
    client.loop_stop()
    client.disconnect()
    sujets = [s for s, _ in MESSAGES if s.startswith("homeassistant/")]
    appareils = {s.split("/")[2] for s in sujets}
    print(f"{len(sujets)} entités publiées pour {len(appareils)} appareils.")


def etages() -> None:
    import asyncio

    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from ws import appeler

    async def main() -> None:
        pieces = {a["name"]: a for a in (await appeler("proprietaire", "config/area_registry/list", {}))["result"]}
        existants = {f["name"]: f for f in (await appeler("proprietaire", "config/floor_registry/list", {}))["result"]}
        for nom, (niveau, icone, liste) in ETAGES.items():
            etage = (
                existants.get(nom)
                or (
                    await appeler(
                        "proprietaire", "config/floor_registry/create", {"name": nom, "level": niveau, "icon": icone}
                    )
                )["result"]
            )
            for piece in liste:
                if piece in pieces:
                    await appeler(
                        "proprietaire",
                        "config/area_registry/update",
                        {"area_id": pieces[piece]["area_id"], "floor_id": etage["floor_id"]},
                    )
        # Les pièces créées d'office à l'accueil et restées vides sont supprimées.
        for vide in ("Chambre",):
            if vide in pieces:
                await appeler("proprietaire", "config/area_registry/delete", {"area_id": pieces[vide]["area_id"]})
        print(f"{len(ETAGES)} étages, {sum(len(v[2]) for v in ETAGES.values())} pièces rangées.")

    asyncio.run(main())


if __name__ == "__main__":
    construire()
    if "--publier" in sys.argv:
        publier()
    else:
        source = Path(__file__).read_text(encoding="utf-8")
        subprocess.run(
            ["docker", "exec", "-i", "automatic-complet", "python3", "-", "--publier"],
            input=source,
            text=True,
            check=True,
        )
        import os
        import time

        os.environ.setdefault("AUTOMATIC_HA", "http://127.0.0.1:8125")
        os.environ.setdefault(
            "AUTOMATIC_SECRETS", str(Path(__file__).resolve().parent.parent / ".secrets" / "complet.json")
        )
        time.sleep(8)  # laisser Home Assistant créer les appareils et les pièces suggérées
        etages()
