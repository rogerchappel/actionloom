import path from "node:path";
import { blockText, countTopLevelMapEntries, firstScalar, lineNumberOf, mapEntriesWithin, topLevelField, topLevelMapEntries } from "./parser.js";
import { findWorkflowFiles } from "./workflows.js";
import type { AuditReport, Finding, InspectOptions, Severity, SeveritySummary, WorkflowFile, WorkflowSummary } from "./types.js";

const severityRank: Record<Severity, number> = { info: 0, low: 1, medium: 2, high: 3 };

export async function inspectRepository(root: string, options: InspectOptions = {}): Promise<AuditReport> {
  const absoluteRoot = path.resolve(root);
  const workflows = await findWorkflowFiles(absoluteRoot);
  const findings = workflows.flatMap((workflow) => auditWorkflow(workflow));
  const summaries = workflows.map(summarizeWorkflow);
  return {
    root: absoluteRoot,
    generatedAt: (options.now ?? new Date()).toISOString(),
    workflowCount: workflows.length,
    summaries,
    findings: findings.sort((a, b) => severityRank[b.severity] - severityRank[a.severity] || a.file.localeCompare(b.file)),
    recommendationCount: findings.length,
    severitySummary: summarizeSeverities(findings),
  };
}

export function auditWorkflow(workflow: WorkflowFile): Finding[] {
  const findings: Finding[] = [];
  const { content, relativePath: file } = workflow;

  const permissions = topLevelField(content, "permissions");
  if (permissions?.value === "write-all") {
    findings.push({
      id: "permissions-write-all",
      title: "Workflow grants write-all permissions",
      severity: "high",
      file,
      line: permissions.line,
      evidence: "permissions: write-all",
      recommendation: "Replace write-all with the smallest explicit permissions map, usually contents: read.",
    });
  }

  const permissionEntries = permissions ? mapEntriesWithin(content, permissions) : [];
  const contentsPermission = permissionEntries.find((entry) => entry.key === "contents");
  if (!permissions) {
    findings.push({
      id: "permissions-missing",
      title: "Workflow does not declare permissions",
      severity: "medium",
      file,
      recommendation: "Declare top-level permissions, for example permissions: contents: read.",
    });
  } else if (contentsPermission?.value === "write" && !permissionEntries.some((entry) => (entry.key === "pull-requests" || entry.key === "id-token") && entry.value === "write")) {
    findings.push({
      id: "contents-write-without-release-context",
      title: "contents: write appears broader than necessary",
      severity: "medium",
      file,
      line: contentsPermission.line,
      evidence: "contents: write",
      recommendation: "Use contents: read for CI; reserve contents: write for release workflows with explicit triggers.",
    });
  }

  if (/pull_request_target\s*:/.test(content)) {
    findings.push({
      id: "pull-request-target",
      title: "pull_request_target requires extra review",
      severity: "high",
      file,
      line: lineNumberOf(content, "pull_request_target"),
      evidence: "pull_request_target",
      recommendation: "Prefer pull_request for untrusted code, or carefully isolate checkout and secrets when pull_request_target is required.",
    });
  }

  if (/uses\s*:\s*actions\/checkout@(?:main|master)\b/m.test(content)) {
    findings.push({
      id: "unpinned-checkout",
      title: "checkout action follows a moving branch",
      severity: "low",
      file,
      line: lineNumberOf(content, /uses\s*:\s*actions\/checkout@/),
      recommendation: "Pin checkout to a stable release tag or to a SHA for stricter supply-chain control.",
    });
  }

  const pipeToShellLine = lineNumberOf(content, /(?:curl|wget)\b.*\|\s*(?:sh|bash)\b/);
  if (pipeToShellLine !== undefined) {
    findings.push({
      id: "pipe-to-shell",
      title: "Remote script is piped to a shell",
      severity: "high",
      file,
      line: pipeToShellLine,
      recommendation: "Download, verify checksum/signature, and execute reviewed scripts explicitly instead of piping network output to a shell.",
    });
  }

  for (const job of topLevelMapEntries(content, "jobs")) {
    const fields = mapEntriesWithin(content, job);
    if (fields.some((entry) => entry.key === "runs-on") && !fields.some((entry) => entry.key === "timeout-minutes")) {
      findings.push({
        id: "timeout-missing",
        title: "Job timeout is not declared",
        severity: "low",
        file,
        line: job.line,
        evidence: `job: ${job.key}`,
        recommendation: "Add timeout-minutes to CI jobs so stuck commands do not burn runner minutes indefinitely.",
      });
    }
  }

  if (/run\s*:\s*npm install\b/.test(content)) {
    findings.push({
      id: "npm-install-in-ci",
      title: "CI uses npm install instead of npm ci",
      severity: "low",
      file,
      line: lineNumberOf(content, /run\s*:\s*npm install\b/),
      recommendation: "Use npm ci in CI so dependency installs are lockfile-based and reproducible.",
    });
  }

  if (/strategy\s*:[\s\S]*matrix\s*:/.test(content) && !/fail-fast\s*:/.test(content)) {
    findings.push({
      id: "matrix-fail-fast-unspecified",
      title: "Matrix job does not specify fail-fast",
      severity: "info",
      file,
      line: lineNumberOf(content, "matrix:"),
      recommendation: "Set strategy.fail-fast intentionally so contributors know whether one failure cancels the matrix.",
    });
  }

  if (/setup-node@/.test(content) && !/cache\s*:\s*['"]?(npm|pnpm|yarn)['"]?/.test(content)) {
    findings.push({
      id: "node-cache-missing",
      title: "Node workflow does not configure dependency caching",
      severity: "low",
      file,
      line: lineNumberOf(content, /setup-node@/),
      recommendation: "Add cache: npm, pnpm, or yarn to actions/setup-node when lockfiles are stable.",
    });
  }

  return findings;
}

export function summarizeWorkflow(workflow: WorkflowFile): WorkflowSummary {
  const content = workflow.content;
  return {
    file: workflow.relativePath,
    name: firstScalar(content, "name"),
    jobCount: countTopLevelMapEntries(content, "jobs"),
    hasMatrix: /strategy\s*:[\s\S]*matrix\s*:/.test(content),
    hasCache: /cache\s*:\s*['"]?(npm|pnpm|yarn)['"]?/.test(content) || /actions\/cache@/.test(content),
    permissions: firstScalar(content, "permissions") ?? (blockText(content, "permissions") ? "custom map" : undefined),
  };
}

export function hasSeverityAtLeast(report: AuditReport, threshold: Severity): boolean {
  return report.findings.some((finding) => severityRank[finding.severity] >= severityRank[threshold]);
}

function summarizeSeverities(findings: Finding[]): SeveritySummary {
  const summary: SeveritySummary = { info: 0, low: 0, medium: 0, high: 0 };
  for (const finding of findings) summary[finding.severity] += 1;
  return summary;
}
