import fs from "node:fs/promises";
import path from "node:path";

export type CheckResult = { level: "error" | "warning" | "pass"; message: string };
type ValidateOptions = { boundCapabilityIds?: string[] };

export type ApplicationManifest = {
  name: string;
  version: string;
  runtime: string;
  entry: string;
  healthPath: string;
  capabilities: string[];
};

async function listSourceFiles(root: string, current = root): Promise<string[]> {
  const entries = await fs.readdir(current, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if ([".next", "node_modules", ".git"].includes(entry.name)) continue;
    const absolute = path.join(current, entry.name);
    if (entry.isDirectory()) files.push(...await listSourceFiles(root, absolute));
    else files.push(absolute);
  }
  return files;
}

export async function readApplicationManifest(workspace: string): Promise<ApplicationManifest> {
  const file = path.join(workspace, "app.yaml");
  const raw = await fs.readFile(file, "utf8");
  const doc: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) { const match = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/); if (match) doc[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, ""); }
  if (!Object.keys(doc).length) throw new Error("app.yaml YAML 格式无效");
  return {
    name: doc.name ?? "",
    version: doc.version ?? "",
    runtime: doc.runtime ?? "",
    entry: doc.entry ?? "",
    healthPath: doc.healthPath ?? "",
    capabilities: [...raw.matchAll(/^\s+-\s+([^\s#]+)/gm)].map((match) => match[1]),
  };
}

export async function validateProject(workspace: string, options: ValidateOptions = {}): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  let manifest: ApplicationManifest;
  try {
    manifest = await readApplicationManifest(workspace);
  } catch (error) {
    return [{ level: "error", message: (error as NodeJS.ErrnoException).code === "ENOENT" ? "缺少 app.yaml" : error instanceof Error ? error.message : "app.yaml 无法读取" }];
  }
  for (const [key, value] of Object.entries({ name: manifest.name, version: manifest.version, runtime: manifest.runtime, entry: manifest.entry, healthPath: manifest.healthPath })) {
    if (!value) results.push({ level: "error", message: `缺少字段 ${key}` });
  }
  if (manifest.healthPath && (!manifest.healthPath.startsWith("/") || manifest.healthPath.startsWith("//") || /[\s?#]/.test(manifest.healthPath))) {
    results.push({ level: "error", message: "healthPath 必须是以 / 开头的站内路径" });
  }
  if (!manifest.capabilities.length) results.push({ level: "warning", message: "capabilities 未配置，项目将以独立模式运行" });
  if (options.boundCapabilityIds && manifest.capabilities.length) { const bound = new Set(options.boundCapabilityIds); for (const capability of manifest.capabilities) if (!bound.has(capability)) results.push({ level: "error", message: `能力未绑定：${capability}` }); }
  const secretPattern = /(api[_-]?key|secret|access[_-]?token)\s*[:=]\s*["']?[A-Za-z0-9_\-/+=]{12,}/i;
  const internalUrlPattern = /https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i;
  for (const sourceFile of await listSourceFiles(workspace)) { if (sourceFile.endsWith("/app.yaml")) continue; const content = await fs.readFile(sourceFile, "utf8"); if (secretPattern.test(content)) results.push({ level: "error", message: `疑似硬编码密钥：${path.relative(workspace, sourceFile)}` }); if (internalUrlPattern.test(content)) results.push({ level: "warning", message: `包含内部 URL：${path.relative(workspace, sourceFile)}` }); }
  if (!results.some((result) => result.level === "error")) results.push({ level: "pass", message: "app.yaml 与发布前安全检查通过" });
  return results;
}
