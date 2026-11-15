"""Transforme les appareils de démonstration en appartement familial, en français.

Crée les pièces, renomme les appareils, les range, masque ceux qui n'ont rien à
faire dans un appartement (tondeuse, vannes d'arrosage…) et laisse volontairement
quelques appareils sans pièce, pour la section « À ranger ».

Usage : python3 dev/scripts/maison_familiale.py (peut être relancé sans risque)
"""

from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path

import aiohttp

sys.path.insert(0, str(Path(__file__).resolve().parent))
from preparer import SECRETS, WS

PIECES = {
    "entree": ("Entrée", "mdi:door-open"),
    "salon": ("Salon", "mdi:sofa-outline"),
    "cuisine": ("Cuisine", "mdi:stove"),
    "chambre": ("Chambre", "mdi:bed-outline"),
    "chambre_des_enfants": ("Chambre des enfants", "mdi:teddy-bear"),
    "salle_de_bain": ("Salle de bain", "mdi:shower"),
    "bureau": ("Bureau", "mdi:desk"),
}

# entité : (nom, pièce ou None pour la laisser « à ranger »)
APPAREILS = {
    "light.entrance_color_white_lights": ("Plafonnier de l'entrée", "entree"),
    "light.ceiling_lights": ("Plafonnier du salon", "salon"),
    "light.living_room_rgbww_lights": ("Lampadaire", "salon"),
    "light.kitchen_lights": ("Réglette du plan de travail", "cuisine"),
    "light.bed_light": ("Lampe de chevet", "chambre"),
    "light.office_rgbw_lights": ("Lampe de bureau", "bureau"),
    "switch.decorative_lights": ("Guirlande lumineuse", "chambre_des_enfants"),
    "switch.ac": ("Prise du lave-linge", "salle_de_bain"),
    "climate.heatpump": ("Radiateur du salon", "salon"),
    "climate.ecobee": ("Radiateur des enfants", "chambre_des_enfants"),
    "climate.hvac": ("Climatisation", "chambre"),
    "cover.living_room_window": ("Volet du salon", "salon"),
    "cover.kitchen_window": ("Volet de la cuisine", "cuisine"),
    "cover.hall_window": ("Volet de la chambre", "chambre"),
    "binary_sensor.basement_floor_wet": ("Fuite sous l'évier", "cuisine"),
    "binary_sensor.movement_backyard": ("Mouvement dans l'entrée", "entree"),
    "vacuum.demo_vacuum_0_ground_floor": ("Aspirateur robot", "salon"),
    "water_heater.demo_water_heater_celsius": ("Chauffe-eau", "salle_de_bain"),
    "alarm_control_panel.security": ("Alarme", None),
    "sensor.total_energy_kwh": ("Énergie consommée", None),
    "sensor.outside_temperature": ("Température extérieure", None),
    # Volontairement sans pièce : ils iront dans « À ranger »
    "fan.living_room_fan": ("Ventilateur", None),
    "sensor.carbon_dioxide": ("Qualité de l'air", None),
}

# Capteurs du paquet maison_essai.yaml (sans appareil) : pièce de chacun
CAPTEURS = {
    "sensor.temperature_entree": "entree",
    "sensor.temperature_salon": "salon",
    "sensor.temperature_cuisine": "cuisine",
    "sensor.temperature_chambre": "chambre",
    "sensor.temperature_chambre_des_enfants": "chambre_des_enfants",
    "sensor.temperature_salle_de_bain": "salle_de_bain",
    "sensor.temperature_bureau": "bureau",
    "sensor.humidite_salon": "salon",
    "sensor.humidite_chambre": "chambre",
    "sensor.humidite_salle_de_bain": "salle_de_bain",
    "sensor.pile_du_capteur_de_fenetre": "chambre",
    "sensor.pile_du_detecteur_de_fuite": "salle_de_bain",
    "sensor.pile_du_capteur_de_porte": "entree",
    "sensor.puissance_du_lave_linge": "salle_de_bain",
    "binary_sensor.fenetre_de_la_chambre": "chambre",
    "binary_sensor.fenetre_du_salon": "salon",
    "binary_sensor.porte_d_entree": "entree",
    "binary_sensor.fuite_dans_la_salle_de_bain": "salle_de_bain",
    "binary_sensor.detecteur_de_fumee": "entree",
    "binary_sensor.presence_dans_le_salon": "salon",
}

# Démonstrations sans rapport avec un appartement : masquées
A_MASQUER_PREFIXES = (
    "button.",
    "date.",
    "datetime.",
    "event.push",
    "lawn_mower.",
    "notify.",
    "number.",
    "select.",
    "text.",
    "time.",
    "valve.",
)
A_MASQUER = {
    "fan.ceiling_fan",
    "fan.percentage_full_fan",
    "fan.percentage_limited_fan",
    "fan.preset_only_limited_fan",
    "sensor.carbon_monoxide",
    "sensor.outside_humidity",
    "sensor.outside_temperature_battery",
    "binary_sensor.outside_temperature_battery_charging",
    "sensor.power_consumption",
    "sensor.thermostat",
    "sensor.total_energy_mwh",
    "sensor.total_gas_ft3",
    "sensor.total_gas_m3",
    "cover.garage_door",
    "cover.pergola_roof",
    "water_heater.demo_water_heater",
    "weather.demo_weather_north",
    "weather.demo_weather_south",
    "vacuum.demo_vacuum_1_first_floor",
    "vacuum.demo_vacuum_2_second_floor",
    "vacuum.demo_vacuum_3_third_floor",
    "vacuum.demo_vacuum_4_fourth_floor",
}


async def main() -> None:
    jeton = json.loads(SECRETS.read_text())["proprietaire"]["jeton"]
    async with aiohttp.ClientSession() as session, WS(session, jeton) as ws:
        await ws.appel(
            "config/core/update", location_name="Appartement d'essai", latitude=43.2965, longitude=5.3698, elevation=12
        )

        existantes = {a["area_id"]: a for a in (await ws.appel("config/area_registry/list"))["result"]}
        for area_id, (nom, icone) in PIECES.items():
            if area_id in existantes:
                await ws.appel("config/area_registry/update", area_id=area_id, name=nom, icon=icone)
            else:
                cree = await ws.appel("config/area_registry/create", name=nom, icon=icone)
                assert cree["result"]["area_id"] == area_id, cree

        entites = {e["entity_id"]: e for e in (await ws.appel("config/entity_registry/list"))["result"]}

        for entity_id, (nom, piece) in APPAREILS.items():
            entite = entites[entity_id]
            # Avec un appareil, c'est l'appareil qui porte le nom : sinon le nom
            # affiché serait « nom de l'appareil + nom de l'entité », en double.
            await ws.appel(
                "config/entity_registry/update",
                entity_id=entity_id,
                name=None if entite.get("device_id") else nom,
                area_id=None,
                hidden_by=None,
            )
            if entite.get("device_id"):
                await ws.appel(
                    "config/device_registry/update", device_id=entite["device_id"], area_id=piece, name_by_user=nom
                )
            else:
                await ws.appel("config/entity_registry/update", entity_id=entity_id, area_id=piece)

        for entity_id, piece in CAPTEURS.items():
            reponse = await ws.appel("config/entity_registry/update", entity_id=entity_id, area_id=piece)
            if not reponse["success"]:
                print("Capteur introuvable :", entity_id)

        masques = 0
        for entity_id in entites:
            if entity_id in A_MASQUER or entity_id.startswith(A_MASQUER_PREFIXES):
                await ws.appel("config/entity_registry/update", entity_id=entity_id, hidden_by="user")
                masques += 1

    print(
        f"{len(PIECES)} pièces, {len(APPAREILS)} appareils renommés, "
        f"{len(CAPTEURS)} capteurs rangés, {masques} démonstrations masquées."
    )


if __name__ == "__main__":
    asyncio.run(main())
