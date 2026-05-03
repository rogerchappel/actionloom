# Contributing

Thanks for helping improve actionloom. This project should stay boring in the best way: deterministic, local-first, well-tested, and careful with CI security advice.

## Development

```sh
npm install
npm test
npm run check
npm run build
npm run smoke
bash scripts/validate.sh
```

## Pull Requests

Good PRs are small and reviewable. Please:

- Explain the workflow problem being solved.
- Add or update fixtures for audit behavior.
- Add tests for rule IDs, severity, and rendered output when relevant.
- Update README examples if CLI behavior changes.
- Avoid hidden network calls, telemetry, credential reads, or publish automation.
- Use Conventional Commit-style messages when practical.

## Adding audit rules

Each rule should have:

- A stable `id`.
- A clear `severity` (`info`, `low`, `medium`, or `high`).
- A recommendation that a maintainer can act on in a PR.
- At least one unsafe fixture assertion.
- A safe fixture or unit test proving common good workflows are not over-flagged.

## Review Pack

For meaningful changes, include:

```md
## Review Pack
Summary:
Verification:
Risk level:
Rollback plan:
Human decision needed:
```

## Philosophy

actionloom should help maintainers and agents produce safer workflow changes, not pretend to be a complete CI security scanner. Prefer precise, explainable checks over noisy magic.
