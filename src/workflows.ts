import { promises as fs } from "node:fs";
import path from "node:path";
import { parseDocument } from "yaml";
import type { WorkflowFile } from "./types.js";

const WORKFLOW_EXTENSIONS = new Set([".yml", ".yaml"]);

export async function pathExists(target: string): Promise<boolean> {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

export async function findWorkflowFiles(root: string): Promise<WorkflowFile[]> {
  const absoluteRoot = path.resolve(root);
  const stat = await fs.stat(absoluteRoot).catch(() => undefined);
  if (!stat) {
    throw new Error(`Path does not exist: ${root}`);
  }

  const files: string[] = [];
  if (stat.isFile()) {
    const extension = path.extname(absoluteRoot).toLowerCase();
    if (!WORKFLOW_EXTENSIONS.has(extension)) {
      throw new Error(`Unsupported workflow file ${absoluteRoot}: expected .yml or .yaml`);
    }
    files.push(absoluteRoot);
  } else {
    const workflowsDir = path.join(absoluteRoot, ".github", "workflows");
    if (!(await pathExists(workflowsDir))) return [];
    await walk(workflowsDir, files);
  }

  const workflowFiles = await Promise.all(files.sort().map(async (filePath) => {
    const content = await fs.readFile(filePath, "utf8");
    validateWorkflowYaml(filePath, content);
    return {
      path: filePath,
      relativePath: path.relative(absoluteRoot, filePath) || path.basename(filePath),
      content,
    };
  }));
  return workflowFiles;
}

function validateWorkflowYaml(filePath: string, content: string): void {
  const document = parseDocument(content, { prettyErrors: true });
  if (document.errors.length > 0) {
    const problem = document.errors[0].message.replace(/\s+/g, " ").trim();
    throw new Error(`Invalid workflow YAML ${filePath}: ${problem}`);
  }
}

async function walk(dir: string, files: string[]): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath, files);
    } else if (entry.isFile() && WORKFLOW_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
}
