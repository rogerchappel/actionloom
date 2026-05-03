import assert from "node:assert/strict";
import { test } from "node:test";
import { auditWorkflow, formatMarkdown, generateNodeCiWorkflow, hasSeverityAtLeast, inspectRepository } from "../dist/index.js";

const fixedNow = new Date("2026-05-04T00:00:00.000Z");

test("inspectRepository reports risky workflow findings from fixtures", async () => {
  const report = await inspectRepository("fixtures/unsafe-workflows", { now: fixedNow });
  assert.equal(report.workflowCount, 1);
  assert.ok(report.findings.some((finding) => finding.id === "permissions-write-all"));
  assert.ok(report.findings.some((finding) => finding.id === "pull-request-target"));
  assert.ok(report.findings.some((finding) => finding.id === "pipe-to-shell"));
  assert.equal(hasSeverityAtLeast(report, "high"), true);
});

test("safe fixture has no medium or high findings", async () => {
  const report = await inspectRepository("fixtures/safe-workflows", { now: fixedNow });
  assert.equal(report.workflowCount, 1);
  assert.equal(hasSeverityAtLeast(report, "medium"), false);
});

test("auditWorkflow detects missing permissions on a single workflow object", () => {
  const findings = auditWorkflow({
    path: "/tmp/ci.yml",
    relativePath: "ci.yml",
    content: "name: CI\non: push\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - run: npm test\n",
  });
  assert.deepEqual(findings.map((finding) => finding.id), ["permissions-missing", "timeout-missing"]);
});

test("markdown formatter includes summaries and recommendations", async () => {
  const report = await inspectRepository("fixtures/unsafe-workflows", { now: fixedNow });
  const markdown = formatMarkdown(report);
  assert.match(markdown, /# actionloom report/);
  assert.match(markdown, /Risky CI/);
  assert.match(markdown, /permissions: write-all/);
});

test("severity summary counts findings by level", async () => {
  const report = await inspectRepository("fixtures/unsafe-workflows", { now: fixedNow });
  assert.equal(report.severitySummary.high, 3);
  assert.ok(report.severitySummary.low >= 2);
});

test("auditWorkflow recommends npm ci for reproducible installs", () => {
  const findings = auditWorkflow({
    path: "/tmp/ci.yml",
    relativePath: "ci.yml",
    content: "name: CI\npermissions:\n  contents: read\njobs:\n  test:\n    runs-on: ubuntu-latest\n    timeout-minutes: 10\n    steps:\n      - run: npm install\n",
  });
  assert.ok(findings.some((finding) => finding.id === "npm-install-in-ci"));
});

test("node CI generator emits safe permissions, matrix, and cache", () => {
  const workflow = generateNodeCiWorkflow({ packageManager: "pnpm", nodeVersions: ["20"], name: "Project CI" });
  assert.match(workflow, /name: Project CI/);
  assert.match(workflow, /permissions:\n  contents: read/);
  assert.match(workflow, /timeout-minutes: 15/);
  assert.match(workflow, /fail-fast: false/);
  assert.match(workflow, /cache: pnpm/);
});
