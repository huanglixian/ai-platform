import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const NEXTJS_ENTERPRISE_FRAMEWORK_ID = "appfactory-nextjs-enterprise";
export const NEXTJS_ENTERPRISE_FRAMEWORK_VERSION = "0.1.0";

const enterpriseRuntimeEnvironmentNames = [
  "DATABASE_URL",
  "APP_AUTH_SECRET",
  "ENTERPRISE_BOOTSTRAP_TOKEN",
] as const;

export type NextjsEnterpriseFrameworkBinding = {
  frameworkId: typeof NEXTJS_ENTERPRISE_FRAMEWORK_ID;
  frameworkVersion: string;
};

type FrameworkManifest = {
  id: string;
  version: string;
};

type FrameworkFile = {
  source: string;
  destination: string;
  relative: string;
};

const templateRoot = path.join(
  process.cwd(),
  "app_factory",
  "templates",
  "nextjs-enterprise",
);

export function enterpriseSchemaForProject(projectId: string) {
  const normalized = projectId.toLowerCase().replace(/[^a-z0-9]/g, "_");
  const schema = `appfactory_${normalized}`;
  if (!/^[a-z][a-z0-9_]{0,62}$/.test(schema)) {
    throw new Error("项目 ID 无法生成有效的企业应用数据库 Schema");
  }
  return schema;
}

export function assertNextjsEnterpriseRuntimeEnvironmentConfigured(
  environment: Record<string, string | undefined> = process.env,
) {
  const missing = enterpriseRuntimeEnvironmentNames.filter(
    (name) => !environment[name]?.trim(),
  );
  if (missing.length) {
    throw new Error(
      `Next.js 企业应用发布需要由宿主运行环境注入：${missing.join("、")}`,
    );
  }
}

function frameworkRoot(version: string) {
  return path.join(templateRoot, "framework", version);
}

function readFrameworkManifest(version: string): FrameworkManifest {
  const file = path.join(frameworkRoot(version), "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(file, "utf8")) as FrameworkManifest;
  if (
    manifest.id !== NEXTJS_ENTERPRISE_FRAMEWORK_ID
    || manifest.version !== version
  ) {
    throw new Error("Next.js 企业 Framework 清单无效");
  }
  return manifest;
}

function listFiles(root: string, current = root): string[] {
  return fs.readdirSync(current, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(current, entry.name);
    if (entry.isDirectory()) return listFiles(root, target);
    return entry.isFile() ? [path.relative(root, target)] : [];
  });
}

function copyContents(source: string, destination: string) {
  fs.mkdirSync(destination, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const from = path.join(source, entry.name);
    const to = path.join(destination, entry.name);
    if (entry.isDirectory()) {
      if (fs.existsSync(to) && !fs.statSync(to).isDirectory()) {
        throw new Error(`Framework 复制路径冲突：${to}`);
      }
      copyContents(from, to);
      continue;
    }
    if (!entry.isFile()) continue;
    if (fs.existsSync(to)) throw new Error(`Framework 复制路径冲突：${to}`);
    fs.copyFileSync(from, to);
  }
}

function renderFrameworkTokens(content: string, databaseSchema: string) {
  return content.replaceAll("{{APP_SCHEMA}}", databaseSchema);
}

function frameworkFiles(version: string): FrameworkFile[] {
  const root = frameworkRoot(version);
  const mappings = [
    [path.join(root, "src", "server"), path.join("src", "server")],
    [path.join(root, "db", "migrations"), path.join("db", "migrations")],
  ] as const;
  return mappings.flatMap(([sourceRoot, destinationRoot]) =>
    listFiles(sourceRoot).map((relative) => ({
      source: path.join(sourceRoot, relative),
      destination: path.join(destinationRoot, relative),
      relative: path.join(destinationRoot, relative),
    })),
  );
}

function coreDirectories(version: string) {
  const root = path.join(frameworkRoot(version), "src", "server");
  return fs.readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

function frameworkFingerprint(version: string, databaseSchema: string) {
  const digest = createHash("sha256");
  for (const file of frameworkFiles(version).sort((left, right) => left.relative.localeCompare(right.relative))) {
    digest.update(file.relative);
    digest.update("\0");
    digest.update(renderFrameworkTokens(fs.readFileSync(file.source, "utf8"), databaseSchema));
    digest.update("\0");
  }
  return digest.digest("hex");
}

function workspaceMarker(version: string, databaseSchema: string) {
  return {
    frameworkId: NEXTJS_ENTERPRISE_FRAMEWORK_ID,
    frameworkVersion: version,
    databaseSchema,
    fingerprint: frameworkFingerprint(version, databaseSchema),
  };
}

export function getNextjsEnterpriseFrameworkBinding(): NextjsEnterpriseFrameworkBinding {
  readFrameworkManifest(NEXTJS_ENTERPRISE_FRAMEWORK_VERSION);
  return {
    frameworkId: NEXTJS_ENTERPRISE_FRAMEWORK_ID,
    frameworkVersion: NEXTJS_ENTERPRISE_FRAMEWORK_VERSION,
  };
}

export function installNextjsEnterpriseFramework(
  workspacePath: string,
  databaseSchema: string,
  version = NEXTJS_ENTERPRISE_FRAMEWORK_VERSION,
) {
  readFrameworkManifest(version);
  const root = frameworkRoot(version);
  copyContents(path.join(root, "src", "server"), path.join(workspacePath, "src", "server"));
  copyContents(path.join(root, "db", "migrations"), path.join(workspacePath, "db", "migrations"));
  fs.writeFileSync(
    path.join(workspacePath, ".appfactory-framework.json"),
    `${JSON.stringify(workspaceMarker(version, databaseSchema), null, 2)}\n`,
  );
}

function listActualFiles(root: string, current = root): string[] {
  if (!fs.existsSync(current)) return [];
  return fs.readdirSync(current, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(current, entry.name);
    if (entry.isDirectory()) return listActualFiles(root, target);
    return entry.isFile() ? [path.relative(root, target)] : [];
  });
}

export function verifyNextjsEnterpriseFramework(
  workspacePath: string,
  databaseSchema: string,
  version = NEXTJS_ENTERPRISE_FRAMEWORK_VERSION,
) {
  const errors: string[] = [];
  try {
    readFrameworkManifest(version);
  } catch (error) {
    return [error instanceof Error ? error.message : "Next.js 企业 Framework 不可用"];
  }

  const expectedMarker = `${JSON.stringify(workspaceMarker(version, databaseSchema), null, 2)}\n`;
  const markerPath = path.join(workspacePath, ".appfactory-framework.json");
  if (!fs.existsSync(markerPath) || fs.readFileSync(markerPath, "utf8") !== expectedMarker) {
    errors.push("企业 Framework 版本或完整性标记无效");
  }

  const expected = new Set<string>();
  for (const file of frameworkFiles(version)) {
    expected.add(file.relative);
    const target = path.join(workspacePath, file.destination);
    if (!fs.existsSync(target)) {
      errors.push(`企业 Framework 缺少受管文件：${file.relative}`);
      continue;
    }
    if (!fs.lstatSync(target).isFile()) {
      errors.push(`企业 Framework 受管文件必须是普通文件：${file.relative}`);
      continue;
    }
    const expectedContent = renderFrameworkTokens(
      fs.readFileSync(file.source, "utf8"),
      databaseSchema,
    );
    if (fs.readFileSync(target, "utf8") !== expectedContent) {
      errors.push(`企业 Framework 受管文件被修改：${file.relative}`);
    }
  }

  for (const directory of coreDirectories(version)) {
    const root = path.join(workspacePath, "src", "server", directory);
    for (const relative of listActualFiles(root)) {
      const fullRelative = path.join("src", "server", directory, relative);
      if (!expected.has(fullRelative)) {
        errors.push(`企业 Framework 包含未受管文件：${fullRelative}`);
      }
    }
  }

  const migrationRoot = path.join(workspacePath, "db", "migrations");
  for (const relative of listActualFiles(migrationRoot)) {
    const match = path.basename(relative).match(/^(\d{4})_[a-z0-9][a-z0-9_-]*\.sql$/i);
    if (!match) continue;
    const number = Number(match[1]);
    const fullRelative = path.join("db", "migrations", relative);
    if (number <= 999 && !expected.has(fullRelative)) {
      errors.push(`Framework 迁移编号区间包含未受管文件：${fullRelative}`);
    }
  }
  return errors;
}
