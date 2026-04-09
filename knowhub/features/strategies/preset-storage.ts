import "server-only";

import { promises as fs } from "fs";
import path from "path";

import type { StrategyPresetStore } from "@/knowhub/features/strategies/types";

const storageRoot = path.join(process.cwd(), "storage", "knowhub", "strategies");
const storePath = path.join(storageRoot, "presets.json");

async function ensureStorageDir() {
  await fs.mkdir(storageRoot, { recursive: true });
}

export async function readStrategyPresetStore() {
  await ensureStorageDir();

  try {
    const content = await fs.readFile(storePath, "utf8");
    const parsed = JSON.parse(content) as Partial<StrategyPresetStore>;

    if (Array.isArray(parsed.items)) {
      return { items: parsed.items } satisfies StrategyPresetStore;
    }

    return { items: [] } satisfies StrategyPresetStore;
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

export async function writeStrategyPresetStore(store: StrategyPresetStore) {
  await ensureStorageDir();
  await fs.writeFile(storePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}
