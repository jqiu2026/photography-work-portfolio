#!/usr/bin/env bash
# Proves the packed UI package works outside Next.js: build, pack, install into examples/vite, build the example.
set -euo pipefail
cd "$(dirname "$0")/.."
rm -rf examples/vite/vendor examples/vite/node_modules examples/vite/dist && mkdir -p examples/vite/vendor
(cd packages/ui && pnpm pack --pack-destination ../../examples/vite/vendor >/dev/null)
(cd examples/vite && npm install --no-audit --no-fund --no-package-lock --silent && npm run build)
echo "example OK"
