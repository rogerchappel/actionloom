import { promises as fs } from "node:fs";
import path from "node:path";
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
    if (WORKFLOW_EXTENSIONS.has(path.extname(absoluteRoot))) files.push(absoluteRoot);
  } else {
    const workflowsDir = path.join(absoluteRoot, ".github", "workflows");
    if (!(await pathExists(workflowsDir))) return [];
    await walk(workflowsDir, files);
  }

  const workflowFiles = await Promise.all(
    files.sort().map(async (filePath) => ({
      path: filePath,
      relativePath: path.relative(absoluteRoot, filePath) || path.basename(filePath),
      content: await fs.readFile(filePath, "utf8"),
    })),
  );
  return workflowFiles;
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
