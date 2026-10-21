#!/bin/sh
# Respaldo en GitHub Pages cuando Vercel no responde: compila con el base de Pages y sube dist/ a la rama gh-pages.
# Uso: npm run pages   →   https://francoperez03.github.io/charlas-bnb-tucuman/
# ponytail: esto reemplaza un workflow de GitHub Actions, que la credencial de git no puede subir (falta el permiso `workflow`).
set -e
cd "$(dirname "$0")/.."
VITE_BASE=/charlas-bnb-tucuman/ npx vite build
remote=$(git remote get-url origin)
tmp=$(mktemp -d)
cp -R dist/. "$tmp"
cd "$tmp"
git init -q && git checkout -q -b gh-pages && git add -A && git commit -qm "pages $(date -u +%Y-%m-%dT%H:%MZ)"
git push -q --force "$remote" gh-pages
rm -rf "$tmp"
echo "publicado en gh-pages"
