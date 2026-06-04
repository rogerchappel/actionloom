import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { test } from "node:test";
import { readFileSync, writeFileSync, unlinkSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import os from "node:os";

const cli = join(process.cwd(), "dist/cli.js");

function runCli(args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn("node", [cli, ...args], { cwd, env: process.env });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("close", (code) => resolve({ stdout, stderr, code }));
    child.on("error", reject);
  });
}

const fixedNow = new Date("2026-05-04T00:00:00.000Z");

test("CLI --help exits 0 and prints usage", async () => {
  const { stdout, code } = await runCli(["--help"]);
  assert.equal(code, 0);
  assert.match(stdout, /inspect/);
  assert.match(stdout, /generate/);
});

test("CLI inspect json output on fixtures/unsafe-workflows", async () => {
  const { stdout, code } = await runCli(["inspect", "fixtures/unsafe-workflows", "--format", "json"]);
  assert.equal(code, 0);
  const report = JSON.parse(stdout);
  assert.ok(report.workflowCount >= 1);
  assert.ok(report.findings.length > 0);
  assert.ok(report.severitySummary);
});

test("CLI inspect markdown output on fixtures/unsafe-workflows", async () => {
  const tmpDir = os.tmpdir();
  const outFile = join(tmpDir, "actionloom-test-report.md");
  const { code, stderr } = await runCli(["inspect", "fixtures/unsafe-workflows", "--format", "markdown", "--output", outFile]);
  assert.equal(code, 0);
  const content = readFileSync(outFile, "utf8");
  assert.match(content, /# actionloom report/);
  if (existsSync(outFile)) unlinkSync(outFile);
});

test("CLI generate node-ci command outputs valid YAML", async () => {
  const { stdout, code } = await runCli(["generate", "node-ci", "--package-manager", "npm"]);
  assert.equal(code, 0);
  assert.match(stdout, /name:/);
  assert.match(stdout, /on:/);
  assert.match(stdout, /jobs:/);
  assert.match(stdout, /contents: read/);
});

test("CLI inspect --fail-on high exits 1 for unsafe fixtures", async () => {
  const { code } = await runCli(["inspect", "fixtures/unsafe-workflows", "--fail-on", "high"]);
  assert.equal(code, 2, "Expected exit code 2 for high-severity findings");
});

test("CLI inspect --fail-on high exits 0 for safe fixtures", async () => {
  const { code } = await runCli(["inspect", "fixtures/safe-workflows", "--fail-on", "high"]);
  assert.equal(code, 0);
});

test("CLI write generated workflow to file", async () => {
  const tmpDir = os.tmpdir();
  const outFile = join(tmpDir, "actionloom-test-ci.yml");
  const { code } = await runCli(["generate", "node-ci", "--output", outFile]);
  assert.equal(code, 0);
  assert.ok(existsSync(outFile));
  const content = readFileSync(outFile, "utf8");
  assert.match(content, /name: CI/);
  if (existsSync(outFile)) unlinkSync(outFile);
});
