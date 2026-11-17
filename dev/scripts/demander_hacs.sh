#!/usr/bin/env bash
# Demande l'inscription d'Automatic Dashboard au catalogue officiel de HACS (et donc au
# Marketplace de Home Assistant), une fois la release publiée et les vérifications vertes.
#
# HACS exige que la demande vienne d'un compte personnel (pas de l'organisation) : le dépôt
# hacs/default est copié (fork) sur votre compte, la ligne est ajoutée dans l'ordre
# alphabétique, puis la pull request est ouverte avec le modèle de HACS rempli et les liens
# demandés (release, vérification HACS, hassfest).
#
# Usage :
#   dev/scripts/demander_hacs.sh --essai   # affiche ce qui serait fait
#   dev/scripts/demander_hacs.sh
set -euo pipefail

ORG=${ORG:-Automatic-Dashboard}
DEPOT_GH="$ORG/automatic-dashboard"
ESSAI=false
[ "${1:-}" = "--essai" ] && ESSAI=true
MOI=$(gh api user --jq .login)
DOSSIER=$(mktemp -d)

# Les liens que le modèle de HACS demande.
RELEASE=$(gh release view -R "$DEPOT_GH" --json url --jq .url)
RUN=$(gh run list -R "$DEPOT_GH" --workflow verifier.yml --status success --limit 1 --json databaseId,url --jq '.[0]')
RUN_ID=$(jq -r .databaseId <<<"$RUN")
JOBS=$(gh run view -R "$DEPOT_GH" "$RUN_ID" --json jobs --jq '.jobs')
LIEN_HACS=$(jq -r '.[] | select(.name == "Validation HACS") | .url' <<<"$JOBS")
LIEN_HASSFEST=$(jq -r '.[] | select(.name == "hassfest") | .url' <<<"$JOBS")
[ -n "$RELEASE" ] && [ -n "$LIEN_HACS" ] && [ -n "$LIEN_HASSFEST" ] || { echo "Il faut une release et une vérification réussie."; exit 1; }
echo "Release : $RELEASE"
echo "HACS : $LIEN_HACS"
echo "hassfest : $LIEN_HASSFEST"

CORPS="$DOSSIER/corps.md"
cat >"$CORPS" <<EOF
## Checklist

- [x] I've read the [publishing documentation](https://hacs.xyz/docs/publish/start).
- [x] I've added the [HACS action](https://hacs.xyz/docs/publish/action) to my repository.
- [x] (For integrations only) I've added the [hassfest action](https://developers.home-assistant.io/blog/2020/04/16/hassfest/) to my repository.
- [x] The actions are passing without any disabled checks in my repository.
- [x] I've added a link to the action run on my repository below in the links section.
- [x] I've created a new release of the repository after the validation actions were run successfully.

## Links

Link to current release: <$RELEASE>
Link to successful HACS action (without the \`ignore\` key): <$LIEN_HACS>
Link to successful hassfest action (if integration): <$LIEN_HASSFEST>
EOF

if $ESSAI; then
  echo; echo "Pull request qui serait ouverte sur hacs/default, depuis $MOI :"; echo; cat "$CORPS"
  exit 0
fi

gh repo fork hacs/default --clone=false >/dev/null 2>&1 || true
git clone -q "https://github.com/$MOI/default.git" "$DOSSIER/default"
cd "$DOSSIER/default"
git remote add amont https://github.com/hacs/default.git
git fetch -q amont master
git switch -q -c ajouter-automatic-dashboard amont/master
# La ligne, à sa place dans l'ordre alphabétique (sans tenir compte des majuscules).
python3 - "$DEPOT_GH" <<'PY'
import json, sys
from pathlib import Path
p = Path("integration")
liste = json.loads(p.read_text())
if sys.argv[1] not in liste:
    liste.append(sys.argv[1])
    liste.sort(key=str.casefold)
p.write_text(json.dumps(liste, indent=2) + "\n")
PY
git commit -q -am "Adds new integration [$DEPOT_GH]"
git push -q origin ajouter-automatic-dashboard
gh pr create -R hacs/default --head "$MOI:ajouter-automatic-dashboard" --title "Adds new integration [$DEPOT_GH]" --body-file "$CORPS"
echo "Demande ouverte. La revue de HACS prend souvent plusieurs mois : rien d'autre à faire, sauf répondre si on vous pose une question."
