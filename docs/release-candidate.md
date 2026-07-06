# Release candidate readiness

Status: **READY**

Generated: 2026-05-05 21:26:31 UTC

## Scope

Release-candidate readiness pass for `rogerchappel/actionloom` against `origin/main`.

2026-07-06 update: added reusable agent skill packaging, package inclusion checks for `SKILL.md`, and README guidance for agent-side workflow use.

## Local verification

- npm ci:pass
- release:check:pass
- validate.sh:pass
- releasebox:pass

## Blockers

- None found in local readiness gates.

## ReleaseBox check / command log

```text
\n===== npm ci =====
+ npm ci --prefix /Users/roger/Developer/my-opensource/_worktrees/actionloom-release-candidate-readiness

added 3 packages, and audited 4 packages in 467ms

found 0 vulnerabilities
EXIT_CODE=0
\n===== npm run release:check =====
+ npm --prefix /Users/roger/Developer/my-opensource/_worktrees/actionloom-release-candidate-readiness run release:check

> actionloom@0.1.0 release:check
> npm run check && npm test && npm run smoke && npm pack --dry-run


> actionloom@0.1.0 check
> tsc --noEmit


> actionloom@0.1.0 test
> npm run build && node --test test/*.test.js


> actionloom@0.1.0 build
> tsc -p tsconfig.json

✔ inspectRepository reports risky workflow findings from fixtures (9.805042ms)
✔ safe fixture has no medium or high findings (0.945125ms)
✔ auditWorkflow detects missing permissions on a single workflow object (0.685666ms)
✔ markdown formatter includes summaries and recommendations (1.035709ms)
✔ severity summary counts findings by level (0.412042ms)
✔ auditWorkflow recommends npm ci for reproducible installs (0.112667ms)
✔ node CI generator emits safe permissions, matrix, and cache (0.096ms)
ℹ tests 7
ℹ suites 0
ℹ pass 7
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 84.620916

> actionloom@0.1.0 smoke
> bash scripts/smoke.sh


> actionloom@0.1.0 build
> tsc -p tsconfig.json

# actionloom report

Root: `/Users/roger/Developer/my-opensource/_worktrees/actionloom-release-candidate-readiness/fixtures/safe-workflows`
Generated: 2026-05-05T21:26:28.818Z
Workflows: 1
Recommendations: 0
Severity: high 0, medium 0, low 0, info 0

## Workflows

- `.github/workflows/ci.yml` — Safe CI
  - jobs: 1; matrix: yes; cache: yes; permissions: contents: read

## Recommendations

No findings. Nice, tidy loom. 🧵
npm notice
npm notice package: actionloom@0.1.0
npm notice Tarball Contents
npm notice 1.1kB LICENSE
npm notice 3.2kB README.md
npm notice 1.5kB SECURITY.md
npm notice 471B dist/audit.d.ts
npm notice 6.8kB dist/audit.js
npm notice 5.0kB dist/audit.js.map
npm notice 31B dist/cli.d.ts
npm notice 4.5kB dist/cli.js
npm notice 4.8kB dist/cli.js.map
npm notice 181B dist/format.d.ts
npm notice 1.9kB dist/format.js
npm notice 2.0kB dist/format.js.map
npm notice 347B dist/index.d.ts
npm notice 250B dist/index.js
npm notice 273B dist/index.js.map
npm notice 359B dist/parser.d.ts
npm notice 1.8kB dist/parser.js
npm notice 2.4kB dist/parser.js.map
npm notice 134B dist/templates.d.ts
npm notice 2.0kB dist/templates.js
npm notice 1.1kB dist/templates.js.map
npm notice 1.0kB dist/types.d.ts
npm notice 44B dist/types.js
npm notice 102B dist/types.js.map
npm notice 200B dist/workflows.d.ts
npm notice 1.6kB dist/workflows.js
npm notice 2.0kB dist/workflows.js.map
npm notice 487B examples/node-ci.yml
npm notice 301B examples/README.md
npm notice 1.4kB package.json
npm notice Tarball Details
npm notice name: actionloom
npm notice version: 0.1.0
npm notice filename: actionloom-0.1.0.tgz
npm notice package size: 13.7 kB
npm notice unpacked size: 47.2 kB
npm notice shasum: 6b612c08e8fb15d3953c60a1425e213f6a228746
npm notice integrity: sha512-6Ia86MWLa1zVw[...]dwN22UiSh0B3A==
npm notice total files: 30
npm notice
actionloom-0.1.0.tgz
EXIT_CODE=0
\n===== bash scripts/validate.sh =====
+ bash -lc cd '/Users/roger/Developer/my-opensource/_worktrees/actionloom-release-candidate-readiness' && bash scripts/validate.sh
Checking actionloom required files...
PASS: required file exists: README.md
PASS: required file exists: AGENTS.md
PASS: required file exists: CONTRIBUTING.md
PASS: required file exists: SECURITY.md
PASS: required file exists: .github/pull_request_template.md
PASS: required file exists: scripts/validate.sh

Checking actionloom required directories...
PASS: required directory exists: .github
PASS: required directory exists: docs
PASS: required directory exists: scripts

Running local project checks where present...
NOTE: using package manager: npm

> actionloom@0.1.0 check
> tsc --noEmit

PASS: package script: check

> actionloom@0.1.0 test
> npm run build && node --test test/*.test.js


> actionloom@0.1.0 build
> tsc -p tsconfig.json

✔ inspectRepository reports risky workflow findings from fixtures (9.583041ms)
✔ safe fixture has no medium or high findings (0.899ms)
✔ auditWorkflow detects missing permissions on a single workflow object (0.695375ms)
✔ markdown formatter includes summaries and recommendations (0.697791ms)
✔ severity summary counts findings by level (0.457833ms)
✔ auditWorkflow recommends npm ci for reproducible installs (0.102375ms)
✔ node CI generator emits safe permissions, matrix, and cache (0.08625ms)
ℹ tests 7
ℹ suites 0
ℹ pass 7
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 81.575125
PASS: package script: test

> actionloom@0.1.0 build
> tsc -p tsconfig.json

PASS: package script: build
NOTE: agent-qc not installed; skipping optional agent check

Validation passed.
EXIT_CODE=0
\n===== releasebox check =====
+ node /Users/roger/Developer/my-opensource/releasebox/bin/releasebox.js check /Users/roger/Developer/my-opensource/_worktrees/actionloom-release-candidate-readiness
✅ releasebox config: node-cli
✅ ci workflow: .github/workflows/ci.yml
✅ release dry run workflow: .github/workflows/release-dry-run.yml
✅ task breakdown: docs/TASKS.md
✅ orchestration plan: docs/ORCHESTRATION.md
✅ dependabot config: .github/dependabot.yml
✅ npm test script: npm run build && node --test test/*.test.js
✅ build script: tsc -p tsconfig.json
✅ smoke script: bash scripts/smoke.sh
✅ bin entry: {"actionloom":"./dist/cli.js"}
EXIT_CODE=0
```
