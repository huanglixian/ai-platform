import fs from "node:fs/promises";
import path from "node:path";

import { getProject } from "@/app_factory/server/database";
import { readWorkspaceFile, resolveWorkspacePath, writeWorkspaceFile } from "@/app_factory/server/workspace";
import { apiError, apiOk } from "@/lib/server/api-response";

export const runtime = "nodejs";

type Baseline = Record<string, string>;

async function readBaseline(root: string): Promise<Baseline> {
  try {
    return JSON.parse(await fs.readFile(path.join(root, ".appfactory-baseline.json"), "utf8")) as Baseline;
  } catch {
    return {};
  }
}

function unifiedDiff(relative: string, before: string | undefined, after: string) {
  if (before === undefined || before === after) return "";
  const oldLines = before.split("\n");
  const newLines = after.split("\n");
  const lines = [`--- a/${relative}`, `+++ b/${relative}`];
  const max = Math.max(oldLines.length, newLines.length);
  for (let index = 0; index < max; index += 1) {
    const oldLine = oldLines[index];
    const newLine = newLines[index];
    if (oldLine === newLine) lines.push(` ${oldLine ?? ""}`);
    else {
      if (oldLine !== undefined) lines.push(`-${oldLine}`);
      if (newLine !== undefined) lines.push(`+${newLine}`);
    }
  }
  return lines.join("\n");
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const project = getProject(id);
  if (!project) return apiError("项目不存在", 404);
  const relative = new URL(request.url).searchParams.get("path");
  if (relative) {
    try {
      const content = await readWorkspaceFile(project.workspacePath, relative);
      const baseline = await readBaseline(project.workspacePath);
      return apiOk({ path: relative, content, changed: baseline[relative] !== undefined && baseline[relative] !== content, diff: unifiedDiff(relative, baseline[relative], content) });
    } catch {
      return apiError("文件不存在", 404);
    }
  }
  const walk = async (directory: string, prefix = ""): Promise<string[]> => {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    const output: string[] = [];
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) output.push(...await walk(resolveWorkspacePath(directory, entry.name), relativePath));
      else output.push(relativePath);
    }
    return output;
  };
  const files = await walk(project.workspacePath);
  if (new URL(request.url).searchParams.get("changed") === "1") {
    const baseline = await readBaseline(project.workspacePath);
    const changed = await Promise.all(files.map(async (filePath) => ({ filePath, content: await readWorkspaceFile(project.workspacePath, filePath) })));
    return apiOk(changed.filter(({ filePath, content }) => baseline[filePath] !== undefined && baseline[filePath] !== content).map(({ filePath }) => filePath));
  }
  return apiOk(files);
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const project = getProject(id);
  if (!project) return apiError("项目不存在", 404);
  const body = await request.json().catch(() => null) as { path?: unknown; content?: unknown } | null;
  if (typeof body?.path !== "string" || typeof body.content !== "string" || !body.path.trim()) return apiError("文件路径和内容格式无效", 422);
  try {
    await writeWorkspaceFile(project.workspacePath, body.path, body.content);
    const baseline = await readBaseline(project.workspacePath);
    return apiOk({ path: body.path, content: body.content, changed: baseline[body.path] !== undefined && baseline[body.path] !== body.content, diff: unifiedDiff(body.path, baseline[body.path], body.content) });
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "文件写入失败", 422);
  }
}
