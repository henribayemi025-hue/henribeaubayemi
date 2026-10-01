#!/usr/bin/env bash
# Finjaro Learn servi sous finjaro.net/learn/ (décision de Beau, 01/10 : « on peut
# juste le déployer comme Accounting », via le menu des applications).
#
# Construit le dépôt Finjaro-learn avec la base /learn/ et la base Supabase
# commune, puis copie le résultat dans public/learn/. Cloudflare le met en
# ligne avec le reste du site à la poussée suivante.
#
#   scripts/importer-learn.sh [chemin du dépôt Finjaro-learn]
set -euo pipefail
LEARN="${1:-../finjaro-learn}"
ICI="$(cd "$(dirname "$0")/.." && pwd)"
URL="https://bokwivwizghdlaedczbw.supabase.co"
# Clé publiable (publique par nature, la même que celle du site).
CLE="$(grep -oE 'sb_publishable_[A-Za-z0-9_-]+' "$ICI/src/lib/supabase.js" | head -1)"
[ -n "$CLE" ] || { echo "clé publiable introuvable" >&2; exit 1; }
cd "$LEARN"
[ -d node_modules ] || npm ci
VITE_SUPABASE_URL="$URL" VITE_SUPABASE_ANON_KEY="$CLE" npx vite build --base /learn/ --outDir "$ICI/public/learn" --emptyOutDir
git -C "$LEARN" rev-parse --short HEAD > "$ICI/public/learn/VERSION"
echo "Learn $(cat "$ICI/public/learn/VERSION") copié dans public/learn/"
