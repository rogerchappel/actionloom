#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

npm run build
node dist/cli.js inspect fixtures/safe-workflows --format markdown --fail-on medium
node dist/cli.js inspect fixtures/unsafe-workflows --format json --output tmp/unsafe-report.json
node dist/cli.js generate node-ci --package-manager npm --node-versions 20,22 --output tmp/generated-ci.yml
