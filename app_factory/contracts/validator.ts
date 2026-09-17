import fs from "node:fs/promises";
import path from "node:path";

import {
  NEXTJS_ENTERPRISE_FRAMEWORK_ID,
  NEXTJS_ENTERPRISE_FRAMEWORK_VERSION,
  verifyNextjsEnterpriseFramework,
} from "@/app_factory/nextjs-enterprise-framework";

export type CheckResult = { level: "error" | "warning" | "pass"; message: string };

export type EnterpriseValidationBinding = {
  frameworkId: string;
  frameworkVersion: string;
  databaseSchema: string;
};

type ValidateOptions = {
  boundCapabilityIds?: string[];
  requiresEnterprise?: boolean;
  enterpriseBinding?: EnterpriseValidationBinding;
};

export type ApplicationManifest = {
  name: string;
  version: string;
  runtime: string;
  entry: string;
  healthPath: string;
  capabilities: string[];
  enterprise: EnterpriseManifest | null;
};

export type EnterpriseManifest = {
  framework: string;
  database: string;
  databaseSchema: string;
  workerEntry: string | null;
};

type SourceFiles = {
  files: string[];
  symbolicLinks: string[];
};

const ignoredSourceDirectories = new Set([".next", "node_modules", ".git"]);

async function listSourceFiles(root: string, current = root): Promise<SourceFiles> {
  const entries = await fs.readdir(current, { withFileTypes: true });
  const files: string[] = [];
  const symbolicLinks: string[] = [];
  for (const entry of entries) {
    if (
      ignoredSourceDirectories.has(entry.name)
      || entry.name === ".env"
      || entry.name.startsWith(".env.")
    ) continue;
    const absolute = path.join(current, entry.name);
    if (entry.isSymbolicLink()) {
      symbolicLinks.push(path.relative(root, absolute));
      continue;
    }
    if (entry.isDirectory()) {
      const nested = await listSourceFiles(root, absolute);
      files.push(...nested.files);
      symbolicLinks.push(...nested.symbolicLinks);
    } else if (entry.isFile()) {
      files.push(absolute);
    }
  }
  return { files, symbolicLinks };
}

export async function readApplicationManifest(workspace: string): Promise<ApplicationManifest> {
  const file = path.join(workspace, "app.yaml");
  const raw = await fs.readFile(file, "utf8");
  const doc: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (match) doc[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
  }
  if (!Object.keys(doc).length) throw new Error("app.yaml YAML 格式无效");
  const enterprise = doc.enterpriseFramework
    ? {
      framework: doc.enterpriseFramework,
      database: doc.database ?? "",
      databaseSchema: doc.databaseSchema ?? "",
      workerEntry: doc.workerEntry || null,
    }
    : null;
  return {
    name: doc.name ?? "",
    version: doc.version ?? "",
    runtime: doc.runtime ?? "",
    entry: doc.entry ?? "",
    healthPath: doc.healthPath ?? "",
    capabilities: [...raw.matchAll(/^\s+-\s+([^\s#]+)/gm)].map((match) => match[1]),
    enterprise,
  };
}

function isSafeRelativePath(value: string) {
  return Boolean(value)
    && !path.isAbsolute(value)
    && !value.split(/[\\/]+/).some((part) => part === ".." || !part);
}

function isDatabaseSchema(value: string) {
  return /^[a-z][a-z0-9_]{0,62}$/.test(value);
}

async function fileExists(root: string, relative: string) {
  if (!isSafeRelativePath(relative)) return false;
  const target = path.resolve(root, relative);
  if (!target.startsWith(`${path.resolve(root)}${path.sep}`)) return false;
  return fs.lstat(target).then((stat) => stat.isFile()).catch(() => false);
}

async function readPackageDependencies(workspace: string, results: CheckResult[]) {
  try {
    const packageJson = JSON.parse(await fs.readFile(path.join(workspace, "package.json"), "utf8")) as {
      dependencies?: Record<string, string>;
    };
    if (!packageJson.dependencies?.pg) {
      results.push({ level: "error", message: "企业应用 package.json 缺少 pg 运行时依赖" });
    }
  } catch {
    results.push({ level: "error", message: "企业应用 package.json 无法读取" });
  }
}

function validateEnterpriseDatabase(
  enterprise: EnterpriseManifest,
  binding?: EnterpriseValidationBinding,
) {
  const results: CheckResult[] = [];
  if (enterprise.database !== "postgresql") {
    results.push({ level: "error", message: "企业应用 database 必须为 postgresql" });
  }
  if (!isDatabaseSchema(enterprise.databaseSchema)) {
    results.push({ level: "error", message: "databaseSchema 必须是合法 PostgreSQL Schema 标识" });
  }
  if (binding && enterprise.databaseSchema !== binding.databaseSchema) {
    results.push({ level: "error", message: "databaseSchema 必须保持为项目分配的隔离 Schema" });
  }
  return results;
}

async function validateNextjsEnterpriseProject(
  workspace: string,
  enterprise: EnterpriseManifest,
  binding?: EnterpriseValidationBinding,
): Promise<CheckResult[]> {
  const results = validateEnterpriseDatabase(enterprise, binding);
  const frameworkId = binding?.frameworkId ?? NEXTJS_ENTERPRISE_FRAMEWORK_ID;
  const frameworkVersion = binding?.frameworkVersion ?? NEXTJS_ENTERPRISE_FRAMEWORK_VERSION;
  if (enterprise.framework !== `${frameworkId}@${frameworkVersion}`) {
    results.push({ level: "error", message: `enterpriseFramework 必须是 ${frameworkId}@${frameworkVersion}` });
  }
  if (enterprise.workerEntry && !await fileExists(workspace, enterprise.workerEntry)) {
    results.push({ level: "error", message: "workerEntry 必须指向 Workspace 内存在的 Worker 入口" });
  }
  if (!await fileExists(workspace, "src/app/api/health/route.ts")) {
    results.push({ level: "error", message: "Next.js 企业应用缺少健康检查路由 src/app/api/health/route.ts" });
  }
  await readPackageDependencies(workspace, results);
  if (frameworkId !== NEXTJS_ENTERPRISE_FRAMEWORK_ID) {
    results.push({ level: "error", message: "项目绑定的 Next.js 企业 Framework 标识不受当前平台支持" });
  } else {
    for (const message of verifyNextjsEnterpriseFramework(
      workspace,
      binding?.databaseSchema || enterprise.databaseSchema,
      frameworkVersion,
    )) {
      results.push({ level: "error", message });
    }
  }
  return results;
}

async function validateEnterpriseProject(
  workspace: string,
  enterprise: EnterpriseManifest,
  binding?: EnterpriseValidationBinding,
): Promise<CheckResult[]> {
  return validateNextjsEnterpriseProject(workspace, enterprise, binding);
}

export async function validateProject(workspace: string, options: ValidateOptions = {}): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  let manifest: ApplicationManifest;
  try {
    manifest = await readApplicationManifest(workspace);
  } catch (error) {
    return [{
      level: "error",
      message: (error as NodeJS.ErrnoException).code === "ENOENT"
        ? "缺少 app.yaml"
        : error instanceof Error ? error.message : "app.yaml 无法读取",
    }];
  }
  for (const [key, value] of Object.entries({
    name: manifest.name,
    version: manifest.version,
    runtime: manifest.runtime,
    entry: manifest.entry,
    healthPath: manifest.healthPath,
  })) {
    if (!value) results.push({ level: "error", message: `缺少字段 ${key}` });
  }
  if (manifest.entry && !await fileExists(workspace, manifest.entry)) {
    results.push({ level: "error", message: "entry 必须是 Workspace 内存在的文件" });
  }
  if (manifest.healthPath && (!manifest.healthPath.startsWith("/") || manifest.healthPath.startsWith("//") || /[\s?#]/.test(manifest.healthPath))) {
    results.push({ level: "error", message: "healthPath 必须是以 / 开头的站内路径" });
  }
  if (!manifest.capabilities.length) results.push({ level: "warning", message: "capabilities 未配置，项目将以独立模式运行" });
  if (options.boundCapabilityIds && manifest.capabilities.length) {
    const bound = new Set(options.boundCapabilityIds);
    for (const capability of manifest.capabilities) {
      if (!bound.has(capability)) results.push({ level: "error", message: `能力未绑定：${capability}` });
    }
  }
  if ((options.requiresEnterprise || options.enterpriseBinding) && !manifest.enterprise) {
    results.push({ level: "error", message: "企业模板不能移除 app.yaml 的企业配置" });
  }
  if (manifest.enterprise) {
    results.push(...await validateEnterpriseProject(
      workspace,
      manifest.enterprise,
      options.enterpriseBinding,
    ));
  }
  const secretPattern = /(?:api[_-]?key|secret|access[_-]?token)\s*[:=]\s*["'][A-Za-z0-9_\-/+=]{12,}["']/i;
  const internalUrlPattern = /https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i;
  const sourceFiles = await listSourceFiles(workspace);
  for (const symbolicLink of sourceFiles.symbolicLinks) {
    results.push({ level: "error", message: `Workspace 不允许符号链接：${symbolicLink}` });
  }
  for (const sourceFile of sourceFiles.files) {
    const relative = path.relative(workspace, sourceFile);
    if (
      relative === "app.yaml"
      || relative === ".appfactory-baseline.json"
    ) continue;
    const content = await fs.readFile(sourceFile, "utf8");
    if (secretPattern.test(content)) results.push({ level: "error", message: `疑似硬编码密钥：${relative}` });
    if (internalUrlPattern.test(content)) results.push({ level: "warning", message: `包含内部 URL：${relative}` });
  }
  if (!results.some((result) => result.level === "error")) {
    results.push({
      level: "pass",
      message: manifest.enterprise
        ? "企业应用结构与受控 Framework 检查通过"
        : "app.yaml 与发布前安全检查通过",
    });
  }
  return results;
}
