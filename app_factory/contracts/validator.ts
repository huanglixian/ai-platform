import fs from "node:fs/promises";
import path from "node:path";

export type CheckResult = { level: "error" | "warning" | "pass"; message: string };
type ValidateOptions = { boundCapabilityIds?: string[] };

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

export async function validateProject(workspace: string, options: ValidateOptions = {}): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const file = path.join(workspace, "app.yaml");
  let raw: string;
  try { raw = await fs.readFile(file, "utf8"); } catch { return [{ level: "error", message: "缺少 app.yaml" }]; }
  const doc: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) { const match = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/); if (match) doc[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, ""); }
  if (!Object.keys(doc).length) return [{ level: "error", message: "app.yaml YAML 格式无效" }];
  for (const key of ["name", "version", "runtime", "entry", "healthPath"]) if (!doc[key]) results.push({ level: "error", message: `缺少字段 ${key}` });
  if (!doc.capabilities) results.push({ level: "warning", message: "capabilities 未配置，项目将以独立模式运行" });
  const capabilities = [...raw.matchAll(/^\s+-\s+([^\s#]+)/gm)].map((match) => match[1]);
  if (options.boundCapabilityIds && capabilities.length) { const bound = new Set(options.boundCapabilityIds); for (const capability of capabilities) if (!bound.has(capability)) results.push({ level: "error", message: `能力未绑定：${capability}` }); }
  const secretPattern = /(api[_-]?key|secret|access[_-]?token)\s*[:=]\s*["']?[A-Za-z0-9_\-/+=]{12,}/i;
  const internalUrlPattern = /https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i;
  for (const sourceFile of await listSourceFiles(workspace)) { if (sourceFile.endsWith("/app.yaml")) continue; const content = await fs.readFile(sourceFile, "utf8"); if (secretPattern.test(content)) results.push({ level: "error", message: `疑似硬编码密钥：${path.relative(workspace, sourceFile)}` }); if (internalUrlPattern.test(content)) results.push({ level: "warning", message: `包含内部 URL：${path.relative(workspace, sourceFile)}` }); }
  if (!results.some((result) => result.level === "error")) results.push({ level: "pass", message: "app.yaml 与发布前安全检查通过" });
  return results;
}
