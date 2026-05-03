import type { AuditReport, Finding } from "./types.js";

export function formatJson(report: AuditReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function formatMarkdown(report: AuditReport): string {
  const lines = [
    `# actionloom report`,
    "",
    `Root: \`${report.root}\``,
    `Generated: ${report.generatedAt}`,
    `Workflows: ${report.workflowCount}`,
    `Recommendations: ${report.recommendationCount}`,
    "",
    "## Workflows",
    "",
  ];

  if (report.summaries.length === 0) {
    lines.push("No workflow files found under `.github/workflows`.", "");
  } else {
    for (const summary of report.summaries) {
      lines.push(`- \`${summary.file}\`${summary.name ? ` — ${summary.name}` : ""}`);
      lines.push(`  - jobs: ${summary.jobCount}; matrix: ${yesNo(summary.hasMatrix)}; cache: ${yesNo(summary.hasCache)}; permissions: ${summary.permissions ?? "not declared"}`);
    }
    lines.push("");
  }

  lines.push("## Recommendations", "");
  if (report.findings.length === 0) {
    lines.push("No findings. Nice, tidy loom. 🧵", "");
  } else {
    for (const finding of report.findings) {
      lines.push(formatFinding(finding), "");
    }
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

function formatFinding(finding: Finding): string {
  const where = finding.line ? `${finding.file}:${finding.line}` : finding.file;
  const evidence = finding.evidence ? `\n  - evidence: \`${finding.evidence}\`` : "";
  return `- **${finding.severity.toUpperCase()}** ${finding.title} (\`${where}\`)${evidence}\n  - ${finding.recommendation}`;
}

function yesNo(value: boolean): string {
  return value ? "yes" : "no";
}
