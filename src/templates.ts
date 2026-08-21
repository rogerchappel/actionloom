import type { TemplateOptions } from "./types.js";

export function generateNodeCiWorkflow(options: TemplateOptions = {}): string {
  const packageManager = options.packageManager ?? "npm";
  const nodeVersions = options.nodeVersions?.length ? options.nodeVersions : ["20", "22"];
  const install = installCommand(packageManager);
  const run = runCommand(packageManager);
  const check = checkCommand(packageManager);
  const cache = packageManager;
  const packageManagerSetup = setupPackageManager(packageManager);
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

${packageManagerSetup}
      - name: Set up Node.js
        uses: actions/setup-node@v6
        with:
          node-version: \${{ matrix.node-version }}
          cache: ${cache}

      - name: Install dependencies
        run: ${install}

      - name: Check types
        run: ${check}

      - name: Run tests
        run: ${run} test
${options.includeSecurity === false ? "" : securityJob()}`;
}

function setupPackageManager(packageManager: string): string {
  if (packageManager === "pnpm") {
    return `      - name: Set up pnpm
        uses: pnpm/action-setup@v4

`;
  }
  if (packageManager === "yarn") {
    return `      - name: Set up Yarn
        run: corepack enable

`;
  }
  return "";
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

function checkCommand(packageManager: string): string {
  if (packageManager === "pnpm") return "pnpm run --if-present check";
  if (packageManager === "yarn") return "yarn run --if-present check";
  return "npm run check --if-present";
}
