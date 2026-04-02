import "server-only";

import { promises as fs } from "fs";
import path from "path";

import type { DocSpaceStore, DocSpaceFileSnapshot } from "@/knowhub/features/docspaces/types";

const storageRoot = path.join(process.cwd(), "storage", "knowhub", "docspaces");
const hostedRoot = path.join(storageRoot, "hosted");
const storePath = path.join(storageRoot, "store.json");

type LocalFileEntry = {
  name: string;
  relativePath: string;
  sizeBytes: number;
  updatedAt: string;
};

async function ensureStorageDirs() {
  await fs.mkdir(hostedRoot, { recursive: true });
}

async function walkLocalDirectory(
  rootPath: string,
  currentPath: string,
  files: LocalFileEntry[],
) {
  const entries = await fs.readdir(currentPath, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(currentPath, entry.name);

    if (entry.isDirectory()) {
      await walkLocalDirectory(rootPath, entryPath, files);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const stat = await fs.stat(entryPath);
    const relativePath = path.relative(rootPath, entryPath).split(path.sep).join("/");

    files.push({
      name: entry.name,
      relativePath: `/${relativePath}`,
      sizeBytes: stat.size,
      updatedAt: stat.mtime.toISOString(),
    });
  }
}

export function getDocSpaceStorePath() {
  return storePath;
}

export function getHostedDocSpacePath(docspaceId: string) {
  return path.join(hostedRoot, docspaceId, "raw");
}

export async function ensureHostedDocSpacePath(docspaceId: string) {
  const hostedPath = getHostedDocSpacePath(docspaceId);
  await fs.mkdir(hostedPath, { recursive: true });
  return hostedPath;
}

export async function removeHostedDocSpacePath(docspaceId: string) {
  const hostedPath = path.join(hostedRoot, docspaceId);
  await fs.rm(hostedPath, { recursive: true, force: true });
}

export async function readDocSpaceStore() {
  await ensureStorageDirs();

  try {
    const content = await fs.readFile(storePath, "utf8");
    return JSON.parse(content) as DocSpaceStore;
  } catch (error) {
    const isMissing =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT";

    if (isMissing) {
      return null;
    }

    throw error;
  }
}

export async function writeDocSpaceStore(store: DocSpaceStore) {
  await ensureStorageDirs();
  await fs.writeFile(storePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

export async function listHostedDocSpaceFiles(docspaceId: string) {
  const hostedPath = await ensureHostedDocSpacePath(docspaceId);
  const files: LocalFileEntry[] = [];

  await walkLocalDirectory(hostedPath, hostedPath, files);

  return files;
}

export function createFileSnapshot(file: LocalFileEntry): DocSpaceFileSnapshot {
  return {
    id: file.relativePath,
    name: file.name,
    path: file.relativePath,
    sizeBytes: file.sizeBytes,
    sizeLabel: "",
    updatedAt: file.updatedAt,
    statusLabel: "已发现",
  };
}
