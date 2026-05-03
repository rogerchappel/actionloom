#!/usr/bin/env node
import { writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { mkdir } from "node:fs/promises";
import { formatJson, formatMarkdown, generateNodeCiWorkflow, hasSeverityAtLeast, inspectRepository } from "./index.js";
import type { Severity, TemplateOptions } from "./types.js";

const severities = new Set(["info", "low", "medium", "high"]);

async function main(argv: string[]): Promise<number> {
  const [command, ...rest] = argv;
  if (!command || command === "--help" || command === "-h") {
    printHelp();
    return 0;
  }
  if (command === "--version" || command === "-v") {
    console.log("0.1.0");
    return 0;
  }

  if (command === "inspect" || command === "audit") return inspectCommand(rest);
  if (command === "generate") return generateCommand(rest);

  console.error(`Unknown command: ${command}`);
  printHelp();
  return 1;
}

async function inspectCommand(args: string[]): Promise<number> {
  const target = args.shift();
  if (!target) throw new Error("inspect requires a repository path or workflow file");
  const options = parseFlags(args);
  const format = String(options.format ?? "markdown");
  if (format !== "markdown" && format !== "json") throw new Error("--format must be markdown or json");
  const report = await inspectRepository(target);
  const rendered = format === "json" ? formatJson(report) : formatMarkdown(report);

  if (options.output) {
    const output = String(options.output);
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, rendered, "utf8");
  } else {
    process.stdout.write(rendered);
  }

  if (options.failOn) {
    const threshold = String(options.failOn) as Severity;
    if (!severities.has(threshold)) throw new Error("--fail-on must be info, low, medium, or high");
    return hasSeverityAtLeast(report, threshold) ? 2 : 0;
  }
  return 0;
}

async function generateCommand(args: string[]): Promise<number> {
  const template = args.shift() ?? "node-ci";
  if (template !== "node-ci") throw new Error("Only the node-ci template is available in v0.1.0");
  const flags = parseFlags(args);
  const options: TemplateOptions = {
    name: stringFlag(flags.name),
    packageManager: packageManagerFlag(flags.packageManager),
    nodeVersions: stringFlag(flags.nodeVersions)?.split(",").map((version) => version.trim()).filter(Boolean),
    includeSecurity: flags.security === undefined ? true : String(flags.security) !== "false",
  };
  const workflow = generateNodeCiWorkflow(options);
  if (flags.output) {
    const output = String(flags.output);
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, workflow, "utf8");
  } else {
    process.stdout.write(workflow);
  }
  return 0;
}

function parseFlags(args: string[]): Record<string, string | boolean> {
  const flags: Record<string, string | boolean> = {};
  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (!token.startsWith("--")) throw new Error(`Unexpected argument: ${token}`);
    const [rawKey, inlineValue] = token.slice(2).split("=", 2);
    const key = rawKey.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase());
    if (inlineValue !== undefined) {
      flags[key] = inlineValue;
    } else if (args[index + 1] && !args[index + 1].startsWith("--")) {
      flags[key] = args[index + 1];
      index += 1;
    } else {
      flags[key] = true;
    }
  }
  return flags;
}

function packageManagerFlag(value: string | boolean | undefined): TemplateOptions["packageManager"] {
  if (!value) return undefined;
  if (value === "npm" || value === "pnpm" || value === "yarn") return value;
  throw new Error("--package-manager must be npm, pnpm, or yarn");
}

function stringFlag(value: string | boolean | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function printHelp(): void {
  console.log(`actionloom — local-first GitHub Actions generator and auditor

Usage:
  actionloom inspect <repo-or-workflow> [--format markdown|json] [--output report.md] [--fail-on high]
  actionloom generate node-ci [--package-manager npm|pnpm|yarn] [--node-versions 20,22] [--output .github/workflows/ci.yml]

Safety:
  actionloom only reads local files and writes explicit --output paths. It makes no network calls.`);
}

main(process.argv.slice(2))
  .then((code) => { process.exitCode = code; })
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
