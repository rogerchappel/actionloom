# Changelog

## Unreleased

- Scoped matrix, fail-fast, and dependency-cache detection to real workflow structures so comments and unrelated YAML fields no longer affect audit results.
- Corrected installation documentation for the current GitHub-release tarball distribution channel.
- Added release validation that prevents advertising an unavailable npm registry package.

## 0.1.0 - 2026-05-04

- Added local-first workflow inspection for `.github/workflows` files.
- Added Markdown and JSON audit reports.
- Added conservative Node CI workflow generation.
- Added fixture-backed tests and real CLI smoke coverage.
- Documented safety boundaries, contribution flow, and audit rule catalog.
- Fixed permission and timeout audits to respect workflow and per-job YAML scopes.
- Reject unknown, duplicate, missing, and empty CLI option values before doing work or writing files.
