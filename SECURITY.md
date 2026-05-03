# Security Policy

## Supported Versions

actionloom is pre-1.0. Security fixes target the latest `main` branch until versioned releases exist.

| Version | Supported |
| --- | --- |
| `main` | Yes, best effort |
| npm releases | Not published yet |

## Reporting a Vulnerability

Please do not post exploit details, secrets, private workflow files, or sensitive repository metadata in public issues.

Until GitHub private vulnerability reporting is enabled, open a public issue asking for a private contact path and include only a short, non-sensitive summary. Once a private path is available, include:

- Affected actionloom version or commit.
- The smallest safe reproduction.
- Impact and severity estimate.
- Suggested mitigation, if you have one.

## Scope

In scope:

- Incorrect audit advice that could encourage unsafe GitHub Actions defaults.
- CLI behavior that reads or writes outside the requested local paths.
- Package, release, or workflow configuration maintained by this repository.

Out of scope:

- Security issues in repositories audited by actionloom.
- Requests for guaranteed maintenance timelines or paid support.
- Social engineering, spam, or attempts to obtain maintainer credentials.

## Project Safety Model

actionloom is intentionally local-first. It should not make hidden network calls, read credentials, publish workflows, or change GitHub settings. Treat any behavior that violates that model as security-relevant.
