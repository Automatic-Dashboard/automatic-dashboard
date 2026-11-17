# Les maisons d'essai

Trois Home Assistant 2026.11.1 dans Docker, sur la machine de développement, pour voir Automatic Dashboard dans les trois modes. Chacun charge l'intégration du dépôt (`custom_components/automatic_dashboard`, en lecture seule) : après `npm run build` dans `frontend/`, recharger la page du navigateur suffit.

| Maison | Adresse | Contenu | Mode attendu |
|---|---|---|---|
| Famille | http://127.0.0.1:8123 | Appareils de démonstration renommés en français, 7 pièces, capteurs fictifs (températures, fenêtres, piles, énergie), deux personnes suivies, un agenda, Météo-France | Maison |
| Débutant | http://127.0.0.1:8124 | Une ampoule, une prise, un thermomètre, la météo par défaut et Météo-France | Découverte |
| Complète | http://127.0.0.1:8125 | 75 appareils simulés comme par Zigbee2MQTT (découverte MQTT, avec pile, qualité du lien, réglages, micrologiciel), 13 pièces sur 2 étages, moniteur système | Complet |

Le tableau est à l'adresse `/automatic-essai/accueil` de chaque maison. Chacune a deux comptes, `essai-admin` (administrateur) et `essai-famille` (sans droits d'administration), dont les mots de passe et les jetons sont dans `dev/.secrets/` (mode 600, jamais versionnés, jamais affichés).

## Démarrer

Docker doit tourner (sur Mac : `colima start`). Depuis la racine du dépôt :

```sh
docker compose -f dev/compose.yaml up -d            # famille
docker compose -f dev/debutant/compose.yaml up -d   # débutant
docker compose -f dev/complet/compose.yaml up -d    # complète (avec un courtier Mosquitto)
```

### Préparer une maison neuve

La première fois (ou après `dev/scripts/effacer.sh`) :

```sh
python3 dev/scripts/preparer.py                     # comptes, réglages France, Automatic Dashboard
python3 dev/scripts/maison_familiale.py             # famille : pièces et noms en français

export AUTOMATIC_HA=http://127.0.0.1:8125 AUTOMATIC_SECRETS=$PWD/dev/.secrets/complet.json
python3 dev/scripts/preparer.py && python3 dev/scripts/maison_complete.py   # complète
```

Puis, pour le bloc « En ce moment » et Météo-France (il faut une connexion à internet) :

```sh
python3 dev/scripts/vie_quotidienne.py              # famille : personnes, agenda, courses, et Météo-France
```

La maison débutant se prépare de la même façon avec `AUTOMATIC_HA=http://127.0.0.1:8124` et `debutant.json`, puis en rangeant l'ampoule et le thermomètre dans le salon. L'intégration MQTT de la maison complète se configure vers le courtier `mosquitto`, port 1883.

## Vérifier

Les mêmes vérifications que GitHub Actions, depuis la racine du dépôt :

```sh
(cd frontend && npm run verifier)                   # tableau : types, tests, construction de automatic-dashboard.js
uv venv && uv pip install -r requirements_test.txt  # une fois : Home Assistant de test
.venv/bin/pytest                                    # intégration : mise en place, thème, réparation, traductions
ruff check . && ruff format --check .               # analyse du code Python
```

Et dans un vrai navigateur, comme le flux hebdomadaire sur la bêta de Home Assistant :

```sh
uv run --with playwright --with aiohttp python dev/scripts/sonde.py      # chaque page, en français et en anglais, et l'éditeur
PYTHON="uv run --with aiohttp python" dev/scripts/maison_neuve.sh ghcr.io/home-assistant/home-assistant:beta 8130 $PWD/dev/neuve
AUTOMATIC_HA=http://127.0.0.1:8130 AUTOMATIC_SECRETS=$PWD/dev/neuve/secrets.json uv run --with playwright --with aiohttp python dev/scripts/sonde.py
docker rm -f automatic-sonde-8130 && rm -rf dev/neuve                    # pour finir
```

`maison_neuve.sh` monte une maison familiale toute neuve sur l'image demandée (le dossier doit être sous votre dossier personnel avec Colima).

## Outils

```sh
python3 dev/scripts/lien_connexion.py                              # un lien qui ouvre le tableau déjà connecté
python3 dev/scripts/ws.py proprietaire config/area_registry/list   # un appel WebSocket, en administrateur
python3 dev/scripts/ws.py famille config/device_registry/list      # le même, avec le compte sans droits
python3 dev/scripts/exporter_maison.py famille                     # met à jour frontend/tests/fixtures/famille.json
docker logs -f automatic-essai                                   # journal de Home Assistant
docker compose -f dev/compose.yaml restart                         # après une modification du code Python
dev/scripts/effacer.sh                                             # tout effacer et repartir de zéro
```

Les variables `AUTOMATIC_HA` et `AUTOMATIC_SECRETS` choisissent la maison pour tous les scripts (famille par défaut).

## Contenu

| Fichier | Rôle |
|---|---|
| `compose.yaml`, `debutant/`, `complet/` | Les trois maisons ; seule la configuration de départ est versionnée, jamais les données produites par Home Assistant |
| `config/packages/maison_essai.yaml` | Les capteurs fictifs de la maison famille, dont l'énergie, intégrée de la puissance |
| `debutant/config/packages/trois_appareils.yaml` | Les trois appareils du débutant |
| `scripts/preparer.py` | Prépare un Home Assistant neuf, sans clic |
| `scripts/maison_familiale.py` | Pièces, noms en français, appareils rangés ou volontairement « à ranger » |
| `scripts/maison_complete.py` | Publie les 75 appareils simulés et crée les étages |
| `scripts/vie_quotidienne.py` | Météo-France pour toutes les maisons ; personnes suivies, agenda et liste de courses pour la maison famille |
| `scripts/lien_connexion.py` | Ouvre le tableau sans taper de mot de passe (code de connexion à usage unique) |
| `scripts/exporter_maison.py` | Exporte une maison pour les tests du moteur, sans jeton, mot de passe ni position |
| `scripts/ws.py` | Appels WebSocket avec l'un des deux comptes |
| `scripts/effacer.sh` | Efface une maison d'essai |
| `maquette/centralhome-essai4.js` | La maquette en JavaScript qui a servi de modèle au code TypeScript |

Les résultats des essais techniques sont dans [docs/cahier-des-charges.md](../docs/cahier-des-charges.md), partie « Résultats des essais ». Le design est dans [docs/conception/](../docs/conception/), à lire en commençant par `00-synthese.md`.
