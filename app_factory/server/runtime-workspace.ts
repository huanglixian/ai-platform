import fsSync from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

import { dataPaths } from "@/lib/data-paths";

const excludedDirectories = new Set([".git", ".next", "node_modules"]);
const excludedFiles = new Set(["tsconfig.tsbuildinfo"]);

function shouldCopy(sourceRoot: string, entry: string) {
  const relative = path.relative(sourceRoot, entry);
  if (!relative) return true;
  const parts = relative.split(path.sep);
  return !parts.some(
    (part) => excludedDirectories.has(part)
      || excludedFiles.has(part)
      || part === ".env"
      || part.startsWith(".env."),
  );
}

async function assertNoSymbolicLinks(sourceRoot: string, current = sourceRoot) {
  const entries = await fs.readdir(current, { withFileTypes: true });
  for (const entry of entries) {
    const target = path.join(current, entry.name);
    if (!shouldCopy(sourceRoot, target)) continue;
    if (entry.isSymbolicLink()) {
      throw new Error(`运行时 Workspace 不允许符号链接：${path.relative(sourceRoot, target)}`);
    }
    if (entry.isDirectory()) await assertNoSymbolicLinks(sourceRoot, target);
  }
}

export function getPreviewWorkspacePath(projectId: string) {
  return path.join(dataPaths.appFactoryPreviewWorkspaces, projectId);
}

export function getReleaseStagingPath(releasePath: string) {
  return `${releasePath}.staging`;
}

export async function materializeRuntimeWorkspace(source: string, destination: string) {
  const sourceRoot = path.resolve(source);
  await assertNoSymbolicLinks(sourceRoot);
  await fs.rm(destination, { recursive: true, force: true });
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.cp(sourceRoot, destination, {
    recursive: true,
    filter: (entry) => shouldCopy(sourceRoot, entry),
  });
}

type PackageManifest = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
};

function copyWorkspaceBinLinks(
  sourceNodeModulesPath: string,
  destinationNodeModulesPath: string,
) {
  const sourceBinPath = path.join(sourceNodeModulesPath, ".bin");
  const destinationBinPath = path.join(destinationNodeModulesPath, ".bin");
  fsSync.mkdirSync(destinationBinPath, { recursive: true });
  for (const command of ["next", "eslint", "tsc"]) {
    const source = path.join(sourceBinPath, command);
    const destination = path.join(destinationBinPath, command);
    if (!fsSync.existsSync(source) || fsSync.existsSync(destination)) continue;
    fsSync.symlinkSync(fsSync.readlinkSync(source), destination);
  }
}

function packagePath(nodeModulesPath: string, packageName: string) {
  return path.join(nodeModulesPath, ...packageName.split("/"));
}

function copyPackageTree(
  sourceNodeModulesPath: string,
  destinationNodeModulesPath: string,
  packageName: string,
  seen: Set<string>,
  optional = false,
) {
  const source = packagePath(sourceNodeModulesPath, packageName);
  const destination = packagePath(destinationNodeModulesPath, packageName);
  if (!fsSync.existsSync(source)) {
    if (optional) return;
    throw new Error(`AppFactory 缺少应用运行依赖：${packageName}`);
  }
  const key = `${source}=>${destination}`;
  if (seen.has(key)) return;
  seen.add(key);
  fsSync.mkdirSync(path.dirname(destination), { recursive: true });
  fsSync.cpSync(source, destination, { recursive: true, force: true });
  const manifest = JSON.parse(
    fsSync.readFileSync(path.join(source, "package.json"), "utf8"),
  ) as PackageManifest;
  const nestedSourceNodeModulesPath = path.join(source, "node_modules");
  const nestedDestinationNodeModulesPath = path.join(destination, "node_modules");
  const copyDependency = (dependency: string, dependencyOptional = false) => {
    const nestedSource = packagePath(nestedSourceNodeModulesPath, dependency);
    if (fsSync.existsSync(nestedSource)) {
      const nestedDestination = packagePath(nestedDestinationNodeModulesPath, dependency);
      const nestedKey = `${nestedSource}=>${nestedDestination}`;
      if (seen.has(nestedKey)) return;
      seen.add(nestedKey);
      fsSync.mkdirSync(path.dirname(nestedDestination), { recursive: true });
      fsSync.cpSync(nestedSource, nestedDestination, { recursive: true, force: true });
      const nestedManifest = JSON.parse(
        fsSync.readFileSync(path.join(nestedSource, "package.json"), "utf8"),
      ) as PackageManifest;
      for (const child of Object.keys(nestedManifest.dependencies || {})) {
        copyPackageTree(sourceNodeModulesPath, destinationNodeModulesPath, child, seen);
      }
      for (const child of Object.keys(nestedManifest.optionalDependencies || {})) {
        copyPackageTree(sourceNodeModulesPath, destinationNodeModulesPath, child, seen, true);
      }
      return;
    }
    copyPackageTree(
      sourceNodeModulesPath,
      destinationNodeModulesPath,
      dependency,
      seen,
      dependencyOptional,
    );
  };
  for (const dependency of Object.keys(manifest.dependencies || {})) {
    copyDependency(dependency);
  }
  for (const dependency of Object.keys(manifest.optionalDependencies || {})) {
    copyDependency(dependency, true);
  }
}

export function seedWorkspaceRuntimeDependencies(
  workspacePath: string,
  {
    includeTypes = true,
    includeToolchain = false,
  }: {
    includeTypes?: boolean;
    includeToolchain?: boolean;
  } = {},
) {
  const sourceNodeModulesPath = path.join(process.cwd(), "node_modules");
  const destinationNodeModulesPath = path.join(workspacePath, "node_modules");
  const seen = new Set<string>();
  const workspacePackage = JSON.parse(
    fsSync.readFileSync(path.join(workspacePath, "package.json"), "utf8"),
  ) as PackageManifest;
  const packages = new Set(Object.keys(workspacePackage.dependencies || {}));
  if (includeToolchain) {
    for (const packageName of Object.keys(workspacePackage.devDependencies || {})) {
      packages.add(packageName);
    }
  }
  for (const packageName of packages) {
    copyPackageTree(sourceNodeModulesPath, destinationNodeModulesPath, packageName, seen);
  }
  if (includeTypes) {
    copyPackageTree(sourceNodeModulesPath, destinationNodeModulesPath, "@types/pg", seen);
    copyPackageTree(sourceNodeModulesPath, destinationNodeModulesPath, "@types/node", seen);
    copyPackageTree(sourceNodeModulesPath, destinationNodeModulesPath, "@types/react", seen);
    copyPackageTree(sourceNodeModulesPath, destinationNodeModulesPath, "@types/react-dom", seen);
  }
  if (includeToolchain) {
    copyWorkspaceBinLinks(sourceNodeModulesPath, destinationNodeModulesPath);
  }
}
