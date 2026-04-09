import "server-only";

import { promises as fs } from "fs";
import path from "path";

import type {
  KnowledgeRunStore,
  KnowledgeStore,
} from "@/knowhub/features/knowledge/types";

const storageRoot = path.join(process.cwd(), "storage", "knowhub", "knowledge");
const storePath = path.join(storageRoot, "store.json");
const runsPath = path.join(storageRoot, "runs.json");

async function ensureStorageDir() {
  await fs.mkdir(storageRoot, { recursive: true });
}

async function readJsonFile<T>(filePath: string) {
  await ensureStorageDir();

  try {
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(content) as T;
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

async function writeJsonFile(filePath: string, value: unknown) {
  await ensureStorageDir();
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function readKnowledgeStore() {
  const parsed = await readJsonFile<Partial<KnowledgeStore>>(storePath);

  if (parsed && Array.isArray(parsed.items)) {
    return { items: parsed.items } satisfies KnowledgeStore;
  }

  return null;
}

export async function writeKnowledgeStore(store: KnowledgeStore) {
  await writeJsonFile(storePath, store);
}

export async function readKnowledgeRunStore() {
  const parsed = await readJsonFile<Partial<KnowledgeRunStore>>(runsPath);

  if (parsed && Array.isArray(parsed.items)) {
    return { items: parsed.items } satisfies KnowledgeRunStore;
  }

  return null;
}

export async function writeKnowledgeRunStore(store: KnowledgeRunStore) {
  await writeJsonFile(runsPath, store);
}
