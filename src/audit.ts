import path from "node:path";
import { blockText, countTopLevelMapEntries, firstScalar, lineNumberOf } from "./parser.js";
import { findWorkflowFiles } from "./workflows.js";
import type { AuditReport, Finding, InspectOptions, Severity, WorkflowFile, WorkflowSummary } from "./types.js";

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
  };
}

export function auditWorkflow(workflow: WorkflowFile): Finding[] {
  const findings: Finding[] = [];
  const { content, relativePath: file } = workflow;

  if (/permissions\s*:\s*write-all\b/.test(content)) {
    findings.push({
      id: "permissions-write-all",
      title: "Workflow grants write-all permissions",
      severity: "high",
      file,
      line: lineNumberOf(content, /permissions\s*:\s*write-all\b/),
      evidence: "permissions: write-all",
      recommendation: "Replace write-all with the smallest explicit permissions map, usually contents: read.",
    });
  }

  const permissionsBlock = blockText(content, "permissions");
  if (!/\n?permissions\s*:/.test(content)) {
    findings.push({
      id: "permissions-missing",
      title: "Workflow does not declare permissions",
      severity: "medium",
      file,
      recommendation: "Declare top-level permissions, for example permissions: contents: read.",
    });
  } else if (permissionsBlock && /contents\s*:\s*write/.test(permissionsBlock) && !/pull-requests\s*:\s*write|id-token\s*:\s*write/.test(permissionsBlock)) {
    findings.push({
      id: "contents-write-without-release-context",
      title: "contents: write appears broader than necessary",
      severity: "medium",
      file,
      line: lineNumberOf(content, /contents\s*:\s*write/),
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

  if (/run\s*:\s*curl\b.*\|\s*(?:sh|bash)/.test(content) || /run\s*:\s*wget\b.*\|\s*(?:sh|bash)/.test(content)) {
    findings.push({
      id: "pipe-to-shell",
      title: "Remote script is piped to a shell",
      severity: "high",
      file,
      line: lineNumberOf(content, /(?:curl|wget).*\|\s*(?:sh|bash)/),
      recommendation: "Download, verify checksum/signature, and execute reviewed scripts explicitly instead of piping network output to a shell.",
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
