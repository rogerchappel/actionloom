import type { TemplateOptions } from "./types.js";

export function generateNodeCiWorkflow(options: TemplateOptions = {}): string {
  const packageManager = options.packageManager ?? "npm";
  const nodeVersions = options.nodeVersions?.length ? options.nodeVersions : ["20", "22"];
  const install = installCommand(packageManager);
  const run = runCommand(packageManager);
  const cache = packageManager;
  const workflowName = options.name ?? "CI";

  return `name: ${workflowName}

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  test:
    name: Node \${{ matrix.node-version }}
    runs-on: ubuntu-latest
    timeout-minutes: 15
    strategy:
      fail-fast: false
      matrix:
        node-version: [${nodeVersions.join(", ")}]
    steps:
      - name: Check out repository
        uses: actions/checkout@v6

      - name: Set up Node.js
        uses: actions/setup-node@v6
        with:
          node-version: \${{ matrix.node-version }}
          cache: ${cache}

      - name: Install dependencies
        run: ${install}

      - name: Check types
        run: ${run} check --if-present

      - name: Run tests
        run: ${run} test
${options.includeSecurity === false ? "" : securityJob()}`;
}

function securityJob(): string {
  return `
  dependency-review:
    name: Dependency review
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    timeout-minutes: 10
    permissions:
      contents: read
      pull-requests: read
    steps:
      - name: Check out repository
        uses: actions/checkout@v6
      - name: Review dependency changes
        uses: actions/dependency-review-action@v5
`;
}

function installCommand(packageManager: string): string {
  if (packageManager === "pnpm") return "pnpm install --frozen-lockfile";
  if (packageManager === "yarn") return "yarn install --immutable";
  return "npm ci";
}

function runCommand(packageManager: string): string {
  if (packageManager === "pnpm") return "pnpm";
  if (packageManager === "yarn") return "yarn";
  return "npm run";
}
