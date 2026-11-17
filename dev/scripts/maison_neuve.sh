#!/usr/bin/env bash
# Monte une maison familiale toute neuve sur l'image de Home Assistant demandée, sans clic :
# conteneur, accueil de Home Assistant, comptes, intégration, tableau, pièces.
# Sert au flux « Bêta de Home Assistant » ; marche aussi sur le Mac.
#
# Usage : dev/scripts/maison_neuve.sh <image> <port> <dossier>
#   dev/scripts/maison_neuve.sh ghcr.io/home-assistant/home-assistant:beta 8130 /tmp/ha-beta
# Puis : AUTOMATIC_HA=http://127.0.0.1:<port> AUTOMATIC_SECRETS=<dossier>/secrets.json python dev/scripts/sonde.py
# Pour finir : docker rm -f automatic-sonde-<port>
set -euo pipefail

IMAGE=$1
PORT=$2
DOSSIER=$3
RACINE=$(cd "$(dirname "$0")/../.." && pwd)
PYTHON=${PYTHON:-python3}

mkdir -p "$DOSSIER/config/packages"
cp "$RACINE/dev/config/configuration.yaml" "$RACINE/dev/config/automations.yaml" \
  "$RACINE/dev/config/scripts.yaml" "$RACINE/dev/config/scenes.yaml" "$DOSSIER/config/"
cp "$RACINE/dev/config/packages/maison_essai.yaml" "$DOSSIER/config/packages/"

docker run -d --name "automatic-sonde-$PORT" -p "127.0.0.1:$PORT:8123" -e TZ=Europe/Paris \
  -v "$DOSSIER/config:/config" \
  -v "$RACINE/custom_components/automatic_dashboard:/config/custom_components/automatic_dashboard:ro" \
  "$IMAGE" >/dev/null

echo "Home Assistant démarre ($IMAGE)…"
for _ in $(seq 1 120); do
  if curl -fs "http://127.0.0.1:$PORT/api/onboarding" >/dev/null 2>&1; then break; fi
  sleep 3
done
curl -fs "http://127.0.0.1:$PORT/api/onboarding" >/dev/null || { docker logs "automatic-sonde-$PORT" | tail -50; exit 1; }
echo "Version : $(docker exec "automatic-sonde-$PORT" cat /config/.HA_VERSION 2>/dev/null || echo inconnue)"

export AUTOMATIC_HA="http://127.0.0.1:$PORT" AUTOMATIC_SECRETS="$DOSSIER/secrets.json"
"$PYTHON" "$RACINE/dev/scripts/preparer.py"
# Les appareils de démonstration arrivent quelques secondes après le démarrage.
"$PYTHON" - <<'PY'
import json, os, time, urllib.request
jeton = json.load(open(os.environ["AUTOMATIC_SECRETS"]))["proprietaire"]["jeton"]
for _ in range(60):
    requete = urllib.request.Request(f"{os.environ['AUTOMATIC_HA']}/api/states", headers={"Authorization": f"Bearer {jeton}"})
    with urllib.request.urlopen(requete) as r:
        if any(e["entity_id"] == "light.entrance_color_white_lights" for e in json.load(r)):
            break
    time.sleep(3)
PY
"$PYTHON" "$RACINE/dev/scripts/maison_familiale.py"
