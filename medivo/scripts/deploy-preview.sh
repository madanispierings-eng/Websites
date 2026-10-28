#!/usr/bin/env bash
# Uploads the source to Netlify, which builds and publishes https://medivo-preview.netlify.app.
# Needs NETLIFY_AUTH_TOKEN (a personal access token). Usage: scripts/deploy-preview.sh
set -euo pipefail
cd "$(dirname "$0")/.."
SITE_ID="${NETLIFY_SITE_ID:-247d21d5-a5ec-4af9-b4a1-9d418aa66853}"
API="https://api.netlify.com/api/v1"
auth=(-H "Authorization: Bearer ${NETLIFY_AUTH_TOKEN:?Set NETLIFY_AUTH_TOKEN}")
zip_file="$(mktemp -d)/medivo-src.zip"

python3 - "$zip_file" <<'PY'
import os, sys, zipfile
skip_dirs = {"node_modules", ".next", ".netlify"}
with zipfile.ZipFile(sys.argv[1], "w", zipfile.ZIP_DEFLATED) as z:
    for d, dirs, files in os.walk("."):
        dirs[:] = [x for x in dirs if x not in skip_dirs]
        for f in files:
            if f.endswith(".tsbuildinfo") or (f.startswith(".env") and f != ".env.example"):
                continue
            z.write(os.path.join(d, f))
PY

deploy_id=$(curl -sf -X POST "$API/sites/$SITE_ID/builds" "${auth[@]}" -H "Content-Type: application/zip" \
  --data-binary @"$zip_file" | python3 -c "import sys, json; print(json.load(sys.stdin)['deploy_id'])")
echo "Building deploy $deploy_id..."
while true; do
  state=$(curl -sf "$API/deploys/$deploy_id" "${auth[@]}" | python3 -c "import sys, json; d = json.load(sys.stdin); print(d['state'])")
  case "$state" in
    ready) echo "Live: https://medivo-preview.netlify.app"; break ;;
    error) echo "Build failed; see the deploy log in the Netlify dashboard." >&2; exit 1 ;;
    *) sleep 10 ;;
  esac
done
