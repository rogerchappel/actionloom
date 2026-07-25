# Release Readiness

Use this checklist before cutting a release or asking a reviewer to trust the package contents.

## Release Artifact Surface

- Package artifact: npm-format `actionloom-<version>.tgz`
- Repository: `https://github.com/rogerchappel/actionloom`
- Distribution channel: the matching GitHub release; npm registry publication is disabled.
- Published files are controlled by the `files` allowlist in `package.json`.

The `npm` entry in `releasebox.config.json` describes the package format and
verification tool. The `github-release` entry is the distribution channel, and
`release.publishNpm: false` means documentation must not advertise bare
`npm install actionloom` commands.

## CLI Surface

- `actionloom` -> `./dist/cli.js`

## Verification Commands

- `npm run check`: `tsc --noEmit`
- `npm run test`: `npm run build && node --test test/*.test.js`
- `npm run build`: `tsc -p tsconfig.json`
- `npm run smoke`: `bash scripts/smoke.sh`
- `npm run package:smoke`: validates the distribution contract, then runs `npm pack --dry-run`
- `npm run release:check`: `npm run check && npm test && npm run smoke && npm run package:smoke`

Run `npm run release:check` when available before opening a release PR. When a command is unavailable, use the closest listed command and record the reason in the PR.

## Reviewer Notes

- Confirm README examples still match the CLI or module exports.
- Confirm README install examples point to an available GitHub release asset while npm publication is disabled.
- Confirm `npm pack --dry-run` does not include local fixtures, generated logs, or build caches beyond the intended allowlist.
- Confirm GitHub Actions runs the same install and package smoke path used locally.
