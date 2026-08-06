# Audit rule catalog

actionloom v0.1.0 ships a small deterministic rule set. Rule IDs are stable enough for tests and scripts, but the project is still pre-1.0.

| Rule ID | Severity | Why it matters |
| --- | --- | --- |
| `permissions-write-all` | high | Broad workflow-level write scopes make workflow compromise more damaging. |
| `pull-request-target` | high | A `pull_request_target` YAML key can expose privileged context to untrusted PR changes when misused. Commented examples are ignored. |
| `pipe-to-shell` | high | Piping remote network output into a shell is difficult to review or reproduce. Inline, block, and folded `run` scalars are inspected; YAML comments are ignored. |
| `permissions-missing` | medium | GitHub defaults can be broader than a small OSS CI job needs; job-level declarations do not replace an explicit workflow-level default. |
| `contents-write-without-release-context` | medium | Write access should be reserved for explicit release or automation workflows. |
| `unpinned-checkout` | low | Moving checkout branches reduce reproducibility. |
| `node-cache-missing` | low | Missing package-manager cache makes matrix CI slower and noisier. |
| `timeout-missing` | low | Each runner job needs its own timeout so one protected job does not leave other jobs able to run indefinitely. |
| `npm-install-in-ci` | low | `npm ci` is more reproducible than `npm install` in CI. Inline, block, and folded `run` scalars are inspected; YAML comments are ignored. |
| `matrix-fail-fast-unspecified` | info | Maintainers should choose matrix cancellation behavior intentionally. |
