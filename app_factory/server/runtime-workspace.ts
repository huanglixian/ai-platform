import fs from "node:fs/promises";
import path from "node:path";

import { dataPaths } from "@/lib/data-paths";

const excludedDirectories = new Set([".git", ".next", "node_modules"]);
const excludedFiles = new Set(["tsconfig.tsbuildinfo"]);

function shouldCopy(sourceRoot: string, entry: string) {
  const relative = path.relative(sourceRoot, entry);
  if (!relative) return true;
  const parts = relative.split(path.sep);
  return !parts.some((part) => excludedDirectories.has(part) || excludedFiles.has(part));
}

export function getPreviewWorkspacePath(projectId: string) {
  return path.join(dataPaths.appFactoryPreviewWorkspaces, projectId);
}

export function getReleaseStagingPath(releasePath: string) {
  return `${releasePath}.staging`;
}

export async function materializeRuntimeWorkspace(source: string, destination: string) {
  const sourceRoot = path.resolve(source);
  await fs.rm(destination, { recursive: true, force: true });
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.cp(sourceRoot, destination, {
    recursive: true,
    filter: (entry) => shouldCopy(sourceRoot, entry),
  });
}
