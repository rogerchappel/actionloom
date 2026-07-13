# ActionLoom Agent Skill

Use this skill when an agent needs to review or generate GitHub Actions workflows for a local OSS repository. It is best for pre-PR CI audits, safe Node.js CI scaffolding, and PR-ready reports about workflow permissions, shell-install patterns, matrix behavior, and cache configuration.

## Inputs

- A local repository path.
- Existing `.github/workflows/*.yml` or `.yaml` files for inspection.
- Optional generation settings for a Node.js CI workflow.

## Required Tools

- Node.js 20 or newer.
- The local `actionloom` CLI from this repository.
- No GitHub token, network access, or live repository write is required.

## Side-Effect Boundaries

- `inspect` reads workflow files under the requested repository path.
- `generate` writes only when an explicit `--output` path is provided.
- ActionLoom does not push branches, open pull requests, publish packages, or change GitHub repository settings.
- Treat generated workflows as draft changes that require human review before merge.

## Workflow

1. Run `actionloom inspect <repo> --format markdown` for a PR-ready report.
2. Use `--format json --output <file>` when another agent or tool will consume the findings.
3. Use `--fail-on medium` or `--fail-on high` in CI gates.
4. Generate a conservative Node workflow only when the repository lacks one or the maintainer requested a replacement.
5. Review the diff before committing any generated workflow.

## Examples

```bash
node dist/cli.js inspect . --format markdown
node dist/cli.js inspect fixtures/unsafe-workflows --format json --output tmp/actionloom-report.json
node dist/cli.js inspect . --fail-on medium
node dist/cli.js generate node-ci --package-manager npm --node-versions 20,22 --output .github/workflows/ci.yml
```

## Verification

Before recommending or packaging changes, run:

```bash
npm run check
npm test
npm run build
npm run smoke
bash scripts/validate.sh
```

For release review, also run:

```bash
npm run package:smoke
```

