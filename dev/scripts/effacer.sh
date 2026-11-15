#!/bin/sh
# Arrête le Home Assistant d'essai et efface tout ce qu'il a généré :
# comptes, jetons, base de données, tableaux. Le code de l'intégration et la
# configuration de départ sont gardés. Ensuite : docker compose up -d, puis preparer.py.
set -eu
ICI=$(cd "$(dirname "$0")/.." && pwd)

printf "Effacer le Home Assistant d'essai (comptes, jetons, données) ? Taper oui : "
read -r reponse
[ "$reponse" = "oui" ] || { echo "Rien n'a été effacé."; exit 1; }

docker compose -f "$ICI/compose.yaml" down
cd "$ICI/config"
rm -rf .storage .cloud .HA_VERSION home-assistant_v2.db* home-assistant.log* tts deps blueprints themes/centralhome.yaml
rm -f "$ICI/.secrets/identifiants.json"
echo "Home Assistant d'essai effacé."
