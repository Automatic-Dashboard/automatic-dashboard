#!/usr/bin/env bash
# Publie Automatic Dashboard pour la première fois, une fois l'organisation GitHub créée :
#   1. met la version sur la branche main des deux dépôts ;
#   2. crée les dépôts automatic-dashboard et automatic-dashboard.github.io dans l'organisation,
#      avec leur description, leurs sujets, les discussions et le signalement privé des failles ;
#   3. active GitHub Pages pour le site (le flux « Publier le site » le met en ligne) ;
#   4. attend que les vérifications passent sur main, puis pose l'étiquette de version :
#      le flux « Publier » crée la release GitHub avec ses notes.
#
# Prérequis : gh connecté avec votre compte (gh auth login), propriétaire de l'organisation.
# Usage :
#   dev/scripts/publier.sh --essai   # affiche ce qui serait fait, sans rien faire
#   dev/scripts/publier.sh           # publie
set -euo pipefail

ORG=${ORG:-Automatic-Dashboard}
DEPOT=$(cd "$(dirname "$0")/../.." && pwd)
SITE=${SITE:-$(cd "$DEPOT/.." && pwd)/centralhome-ha.github.io}
VERSION=$(jq -r .version "$DEPOT/custom_components/automatic_dashboard/manifest.json")
BRANCHE="version-$VERSION"
ESSAI=false
[ "${1:-}" = "--essai" ] && ESSAI=true

DESCRIPTION="A complete Home Assistant dashboard that builds itself from your rooms, floors and devices. No YAML, no cards to install."
SUJETS=(home-assistant hacs hacs-integration dashboard automatic-dashboard auto-generated dashboard-strategy lovelace lovelace-strategy
  zero-config home-automation smart-home)

faire() {
  echo "→ $*"
  if ! $ESSAI; then "$@"; fi
}

echo "Automatic Dashboard $VERSION → organisation $ORG"
echo "Intégration : $DEPOT"
echo "Site : $SITE"
gh auth status >/dev/null 2>&1 || { echo "Connectez d'abord gh : gh auth login"; exit 1; }
# En essai, un prérequis manquant est signalé sans arrêter : on voit tout ce qui serait fait.
manque() {
  echo "✗ $1"
  $ESSAI || exit 1
}
gh api "orgs/$ORG" >/dev/null 2>&1 || manque "L'organisation $ORG n'existe pas encore : créez-la sur github.com/organizations/plan"
[ -f "$DEPOT/custom_components/automatic_dashboard/brand/icon.png" ] || manque "Il manque brand/icon.png (exigé par HACS)"
[ -z "$(git -C "$DEPOT" status --porcelain)" ] || manque "L'intégration a des changements non commités"
[ -z "$(git -C "$SITE" status --porcelain)" ] || manque "Le site a des changements non commités"
if [ "$(gh api graphql -f query='{viewer{hasSponsorsListing}}' --jq .data.viewer.hasSponsorsListing 2>/dev/null)" != "true" ]; then
  echo "Attention : votre profil GitHub Sponsors n'existe pas encore. Le bouton « Sponsor » (.github/FUNDING.yml) mènera à une page vide."
fi

echo; echo "1. La version sur main"
if git -C "$DEPOT" show-ref --verify --quiet "refs/heads/$BRANCHE"; then
  faire git -C "$DEPOT" switch main
  faire git -C "$DEPOT" merge --ff-only "$BRANCHE"
fi
if [ "$(git -C "$SITE" branch --show-current)" != "main" ]; then
  # Le site n'a jamais eu de main : sa branche de version le devient.
  faire git -C "$SITE" branch -M main
fi

echo; echo "2. Le dépôt de l'intégration"
# La description et les sujets d'abord : la validation HACS les vérifie dès le premier envoi.
faire gh repo create "$ORG/automatic-dashboard" --public --description "$DESCRIPTION" --homepage "https://automatic-dashboard.github.io"
faire gh repo edit "$ORG/automatic-dashboard" --enable-discussions --enable-issues --enable-wiki=false \
  $(printf -- "--add-topic %s " "${SUJETS[@]}")
faire gh api -X PUT "repos/$ORG/automatic-dashboard/private-vulnerability-reporting"
git -C "$DEPOT" remote get-url origin >/dev/null 2>&1 || faire git -C "$DEPOT" remote add origin "https://github.com/$ORG/automatic-dashboard.git"
faire git -C "$DEPOT" push -u origin main

echo; echo "3. Le site"
faire gh repo create "$ORG/automatic-dashboard.github.io" --public \
  --description "Le site d'Automatic Dashboard : présentation, démo et documentation, en français et en anglais." \
  --homepage "https://automatic-dashboard.github.io"
git -C "$SITE" remote get-url origin >/dev/null 2>&1 || faire git -C "$SITE" remote add origin "https://github.com/$ORG/automatic-dashboard.github.io.git"
faire git -C "$SITE" push -u origin main
# Pages par GitHub Actions, une fois le dépôt rempli ; puis le flux « Publier le site » est relancé pour le mettre en ligne.
faire gh api -X POST "repos/$ORG/automatic-dashboard.github.io/pages" -f build_type=workflow
$ESSAI || sleep 5
faire gh workflow run publier.yml -R "$ORG/automatic-dashboard.github.io" --ref main

echo; echo "4. Les vérifications, puis la version"
if ! $ESSAI; then
  echo "Attente des vérifications sur main (quelques minutes)…"
  sleep 20
  RUN=$(gh run list -R "$ORG/automatic-dashboard" --workflow verifier.yml --branch main --limit 1 --json databaseId --jq '.[0].databaseId')
  gh run watch -R "$ORG/automatic-dashboard" "$RUN" --exit-status || { echo "Les vérifications échouent : corrigez avant de poser la version."; exit 1; }
fi
faire git -C "$DEPOT" tag -a "$VERSION" -m "Automatic Dashboard $VERSION"
faire git -C "$DEPOT" push origin "$VERSION"

echo
echo "C'est publié."
echo "  Release : https://github.com/$ORG/automatic-dashboard/releases/tag/$VERSION (créée par le flux « Publier »)"
echo "  Site    : https://automatic-dashboard.github.io (mis en ligne par le flux « Publier le site »)"
echo "Ensuite : dev/scripts/demander_hacs.sh, pour demander l'inscription au catalogue officiel de HACS."
