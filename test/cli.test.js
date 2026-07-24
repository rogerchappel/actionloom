import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { test } from "node:test";
import { readFileSync, unlinkSync, existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
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

for (const command of ["inspect", "generate"]) {
  const prefix = command === "inspect" ? ["inspect", "fixtures/safe-workflows"] : ["generate", "node-ci"];

  test(`CLI ${command} rejects missing --output values without writing`, async () => {
    const cwd = mkdtempSync(join(os.tmpdir(), `actionloom-${command}-`));
    try {
      const { code, stderr } = await runCli([...prefix, "--output"], cwd);
      assert.equal(code, 1);
      assert.match(stderr, /--output requires a value/);
      assert.deepEqual(readdirNames(cwd), []);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  test(`CLI ${command} rejects unknown and duplicate options`, async () => {
    const unknown = await runCli([...prefix, "--bogus", "value"]);
    assert.equal(unknown.code, 1);
    assert.match(unknown.stderr, /Unknown option: --bogus/);

    const duplicate = await runCli([...prefix, "--output", "one", "--output=two"]);
    assert.equal(duplicate.code, 1);
    assert.match(duplicate.stderr, /Duplicate option: --output/);
  });

  test(`CLI ${command} accepts separate and inline option values`, async () => {
    const separate = command === "inspect"
      ? await runCli([...prefix, "--format", "json"])
      : await runCli([...prefix, "--package-manager", "npm"]);
    assert.equal(separate.code, 0);

    const inline = command === "inspect"
      ? await runCli([...prefix, "--format=json"])
      : await runCli([...prefix, "--package-manager=npm"]);
    assert.equal(inline.code, 0);
  });
}

test("CLI rejects empty values for every documented value-taking option", async () => {
  const cases = [
    ["inspect", "fixtures/safe-workflows", "--format="],
    ["inspect", "fixtures/safe-workflows", "--fail-on="],
    ["generate", "node-ci", "--package-manager="],
    ["generate", "node-ci", "--node-versions="],
    ["generate", "node-ci", "--output="],
  ];
  for (const args of cases) {
    const { code, stderr } = await runCli(args);
    assert.equal(code, 1, args.join(" "));
    assert.match(stderr, /requires a non-empty value/);
  }
});

function readdirNames(path) {
  return [...new Set(readdirSync(path))].sort();
}
