export type Severity = "info" | "low" | "medium" | "high";

export interface WorkflowFile {
  path: string;
  relativePath: string;
  content: string;
}

export interface Finding {
  id: string;
  title: string;
  severity: Severity;
  file: string;
  line?: number;
  evidence?: string;
  recommendation: string;
}

export interface WorkflowSummary {
  file: string;
  name?: string;
  jobCount: number;
  hasMatrix: boolean;
  hasCache: boolean;
  permissions?: string;
}

export type SeveritySummary = Record<Severity, number>;

export interface AuditReport {
  root: string;
  generatedAt: string;
  workflowCount: number;
  summaries: WorkflowSummary[];
  findings: Finding[];
  recommendationCount: number;
  severitySummary: SeveritySummary;
}

export interface InspectOptions {
  now?: Date;
}

export interface TemplateOptions {
  name?: string;
  packageManager?: "npm" | "pnpm" | "yarn";
  nodeVersions?: string[];
  includeSecurity?: boolean;
}
