# Les maisons d'essai

Trois Home Assistant 2026.11.1 dans Docker, sur la machine de développement, pour voir CentralHome dans les trois modes. Chacun charge l'intégration du dépôt (`custom_components/centralhome`, en lecture seule) : après `npm run build` dans `frontend/`, recharger la page du navigateur suffit.

| Maison | Adresse | Contenu | Mode attendu |
|---|---|---|---|
| Famille | http://127.0.0.1:8123 | Appareils de démonstration renommés en français, 7 pièces, capteurs fictifs (températures, fenêtres, piles, énergie) | Maison |
| Débutant | http://127.0.0.1:8124 | Une ampoule, une prise, un thermomètre et la météo par défaut | Découverte |
| Complète | http://127.0.0.1:8125 | 75 appareils simulés comme par Zigbee2MQTT (découverte MQTT, avec pile, qualité du lien, réglages, micrologiciel), 13 pièces sur 2 étages, moniteur système | Complet |

Le tableau est à l'adresse `/centralhome-essai/accueil` de chaque maison. Chacune a deux comptes, `essai-admin` (administrateur) et `essai-famille` (sans droits d'administration), dont les mots de passe et les jetons sont dans `dev/.secrets/` (mode 600, jamais versionnés, jamais affichés).

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
python3 dev/scripts/preparer.py                     # comptes, réglages France, CentralHome
python3 dev/scripts/maison_familiale.py             # famille : pièces et noms en français

export CENTRALHOME_HA=http://127.0.0.1:8125 CENTRALHOME_SECRETS=$PWD/dev/.secrets/complet.json
python3 dev/scripts/preparer.py && python3 dev/scripts/maison_complete.py   # complète
```

La maison débutant se prépare de la même façon avec `CENTRALHOME_HA=http://127.0.0.1:8124` et `debutant.json`, puis en rangeant l'ampoule et le thermomètre dans le salon. L'intégration MQTT de la maison complète se configure vers le courtier `mosquitto`, port 1883.

## Outils

```sh
python3 dev/scripts/ws.py proprietaire config/area_registry/list   # un appel WebSocket, en administrateur
python3 dev/scripts/ws.py famille config/device_registry/list      # le même, avec le compte sans droits
python3 dev/scripts/exporter_maison.py famille                     # met à jour frontend/tests/fixtures/famille.json
docker logs -f centralhome-essai                                   # journal de Home Assistant
docker compose -f dev/compose.yaml restart                         # après une modification du code Python
dev/scripts/effacer.sh                                             # tout effacer et repartir de zéro
```

Les variables `CENTRALHOME_HA` et `CENTRALHOME_SECRETS` choisissent la maison pour tous les scripts (famille par défaut).

## Contenu

| Fichier | Rôle |
|---|---|
| `compose.yaml`, `debutant/`, `complet/` | Les trois maisons ; seule la configuration de départ est versionnée, jamais les données produites par Home Assistant |
| `config/packages/maison_essai.yaml` | Les capteurs fictifs de la maison famille, dont l'énergie, intégrée de la puissance |
| `debutant/config/packages/trois_appareils.yaml` | Les trois appareils du débutant |
| `scripts/preparer.py` | Prépare un Home Assistant neuf, sans clic |
| `scripts/maison_familiale.py` | Pièces, noms en français, appareils rangés ou volontairement « à ranger » |
| `scripts/maison_complete.py` | Publie les 75 appareils simulés et crée les étages |
| `scripts/exporter_maison.py` | Exporte une maison pour les tests du moteur, sans jeton ni mot de passe |
| `scripts/ws.py` | Appels WebSocket avec l'un des deux comptes |
| `scripts/effacer.sh` | Efface une maison d'essai |
| `maquette/centralhome-essai4.js` | La maquette en JavaScript qui a servi de modèle au code TypeScript |

Les résultats des essais techniques sont dans [docs/cahier-des-charges.md](../docs/cahier-des-charges.md), partie « Résultats des essais ». Le design est dans [docs/conception/](../docs/conception/), à lire en commençant par `00-synthese.md`.
