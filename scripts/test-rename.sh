#!/usr/bin/env bash
# Tests scripts/rename.mjs on a scratch copy (never touches the working tree).
set -euo pipefail
cd "$(dirname "$0")/.."
tmp="$(mktemp -d)"
rsync -a --exclude node_modules --exclude .next --exclude .git --exclude dist --exclude "public/opt" --exclude "public/images" --exclude "public/sequence" --exclude "docs/project/screenshots" --exclude test-results ./ "$tmp/"
node scripts/rename.mjs --root "$tmp" --package @acme/kit --brand AcmeKit --prefix ac
left="$(grep -rIl "@placeholder/ui\|PlaceholderUI\|--ph-" "$tmp" --exclude-dir=node_modules --exclude-dir=docs --exclude=brand.config.json --exclude=pnpm-lock.yaml || true)"
if [ -n "$left" ]; then echo "leftovers:"; echo "$left"; exit 1; fi
(cd "$tmp" && pnpm install --prefer-offline >/dev/null && pnpm --filter @acme/kit typecheck && pnpm --filter @acme/kit test)
echo "rename OK (scratch copy: $tmp)"
