# actionloom

actionloom is a local-first GitHub Actions workflow generator and auditor for small OSS repositories. It reads workflow files from your checkout, points out risky permissions and CI footguns, and can loom a practical Node.js CI workflow template without calling any external service.

The project is original work inspired by the workflow-helper niche noted in the product docs, including attribution to [`hip-actions`](https://github.com/vincentkoc/hip-actions) as adjacent inspiration. It does not copy that project name or implementation.

## What it does

- Audits `.github/workflows/*.yml` and `.yaml` files.
- Flags high-risk patterns such as `permissions: write-all`, `pull_request_target`, and `curl | bash`.
- Checks for intentional matrix `fail-fast` and Node dependency cache configuration.
- Emits Markdown or JSON reports that are easy to paste into PRs.
- Generates a conservative Node CI template with read-only default permissions.

## Install

actionloom is currently distributed as an npm-format tarball attached to each
[GitHub release](https://github.com/rogerchappel/actionloom/releases). It is not
published to the npm registry.

Install version 0.1.0 in a project directly from the release asset:

```sh
npm install https://github.com/rogerchappel/actionloom/releases/download/v0.1.0/actionloom-0.1.0.tgz
```

For local development:

```sh
git clone https://github.com/rogerchappel/actionloom.git
cd actionloom
npm install
npm run build
node dist/cli.js --help
```

For global CLI usage:

```sh
npm install -g https://github.com/rogerchappel/actionloom/releases/download/v0.1.0/actionloom-0.1.0.tgz
actionloom inspect .
```

## Quickstart

Audit a repository and print a PR-ready Markdown report:

```sh
node dist/cli.js inspect . --format markdown
```

Write JSON for another tool or agent:

```sh
node dist/cli.js inspect . --format json --output actionloom-report.json
```

Fail when medium-or-higher findings exist:

```sh
node dist/cli.js inspect . --fail-on medium
```

Generate a Node CI workflow:

```sh
node dist/cli.js generate node-ci \
  --package-manager npm \
  --node-versions 20,22 \
  --output .github/workflows/ci.yml
```

## Examples

Try the included fixtures:

```sh
npm run build
node dist/cli.js inspect fixtures/unsafe-workflows --format markdown
node dist/cli.js inspect fixtures/safe-workflows --format json
```

The unsafe fixture intentionally contains risky patterns so the report has something useful to say.

## Library API

```ts
import { formatMarkdown, inspectRepository } from "actionloom";

const report = await inspectRepository(".");
console.log(formatMarkdown(report));
```

## Agent Skill

This repository includes [SKILL.md](./SKILL.md) for agents that need a reusable local workflow for GitHub Actions audits and conservative Node CI generation. The skill documents when to inspect, when generation is appropriate, the explicit write boundary for `--output`, and the verification commands to run before recommending workflow changes.

## Verification

Run the local quality gates before opening a pull request:

```sh
npm run lint
npm test
npm run smoke
```

`npm run lint` is an alias for the repository static check so contributors can use the common npm workflow without guessing the project-specific command.

## Safety boundaries

- Local-first by design: actionloom does not make network calls.
- It only reads the path you ask it to inspect.
- It only writes files when you pass an explicit `--output` path.
- It does not read credentials, environment secrets, or GitHub tokens.
- It does not publish, open pull requests, or mutate GitHub settings.

## Verification

```sh
npm test
npm run check
npm run build
npm run smoke
bash scripts/validate.sh
```

## Rule catalog

See [docs/RULES.md](docs/RULES.md) for the current audit rule IDs and severity levels.

## Roadmap

- More workflow rules with stable IDs.
- SARIF output for code scanning ingestion.
- Template presets for Python, Rust, and mixed monorepos.
- Safer autofix suggestions that remain opt-in and reviewable.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Keep changes small, add fixture-backed tests, and include the exact verification commands you ran.

## Security

See [SECURITY.md](SECURITY.md). Please do not include secrets or exploit details in public issues.

## License

MIT

## Release Verification

Before publishing or tagging a release, run the local verification path that matches CI:

- `npm run release:check`
- `npm run package:smoke`

The release checklist in `docs/release-readiness.md` captures the package surface, CLI bins, and reviewer notes for future release PRs.
