# actionloom docs

actionloom is a local-first GitHub Actions workflow generator and auditor. The MVP scope is intentionally narrow: inspect local workflow files, emit deterministic recommendations, and generate a conservative Node.js CI template.

## Commands

- `actionloom inspect <repo-or-workflow>` — scan local workflow files and render Markdown by default.
- `actionloom inspect <repo> --format json` — emit structured reports for agents or scripts.
- `actionloom inspect <repo> --fail-on medium` — exit non-zero when findings at or above a threshold exist.
- `actionloom generate node-ci --package-manager npm --node-versions 20,22` — print a safe Node CI workflow template.

## Fixture shape

Fixtures are normal repositories with `.github/workflows/*.yml` files. Tests use:

- `fixtures/unsafe-workflows` for risky permissions, `pull_request_target`, missing cache, and pipe-to-shell patterns.
- `fixtures/safe-workflows` for a small clean Node CI baseline.

## Safety promise

No hidden network calls. No token reads. No GitHub mutations. File writes only happen through explicit output flags.
