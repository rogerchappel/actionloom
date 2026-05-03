# actionloom

Status: in-progress
Decision: build now

## Scorecard

Total: 0/100
Band: public backlog
Last scored: 2026-05-02
Scored by: Neo

| Criterion | Points | Notes |
|---|---:|---|
| Problem pain | 0/20 | Needs qualification. |
| Demand signal | 0/20 | Seed signal from source repo; needs independent validation. |
| V1 buildability | 0/20 | Needs scoping pass. |
| Differentiation | 0/15 | Renamed/reframed from adjacent inspiration. |
| Agentic workflow leverage | 0/15 | Needs workflow fit assessment. |
| Distribution potential | 0/10 | Needs demo/content angle. |

## Pitch

A GitHub Actions workflow generator and auditor for small OSS repos, with local linting and safety checklists.

## Why It Matters

This is a renamed backlog idea inspired by an external repo/activity signal. It should be treated as a fresh OSS concept, not a copy of the source project. The first qualification pass should identify Roger-specific workflow value, defensible differentiation, and a tiny local-first V1.

## Qualification

### Pub Test

Can this be explained clearly in one sentence to local-first or agentic-tooling developers? Needs validation.

### Competitors / Adjacent Tools

- `hip-actions` — source inspiration: https://github.com/vincentkoc/hip-actions (JavaScript, stars/forks signal: not listed).

### Star / Demand Signal

Seed signal from the linked public repository list shared by Roger on 2026-05-02. Re-check stars, forks, issues, and recent commits before promoting to ready.

### Real Problem

Needs a qualification pass to separate durable workflow pain from novelty. Prefer local-first, testable, agent-useful slices.

### V1 Buildability

Likely buildable as a deterministic CLI/library/demo if scoped to fixtures, local files, and explicit external calls only.

## V1 Scope

- Generate workflow templates
- Audit existing workflows for risky permissions
- Validate matrix and cache config
- Emit PR-ready recommendations

## Out of Scope

- Copying the source repo name or implementation directly.
- Hidden network calls, credential scraping, telemetry, or publishing.
- Broad platform replacement in V1.

## CLI/API Sketch

```bash
actionloom --help
actionloom inspect ./fixtures/sample --output ./out
```

## Verification

- Unit tests for fixture parsing and report generation.
- CLI smoke test using local fixtures.
- README with install, quickstart, safety notes, and source attribution.
- No hidden network, credential, or publish behavior.

## Agent Prompt

Build `actionloom` as a renamed, local-first OSS idea inspired by `hip-actions`. Preserve attribution, avoid direct copying, and focus V1 on deterministic fixtures, clear safety boundaries, and practical agent/developer workflow value.
