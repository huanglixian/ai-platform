import "server-only";

import { promises as fs } from "fs";
import path from "path";

import type { EmbeddingConfigRecord } from "@/knowhub/features/settings/embedding/embedding-types";
import { dataPaths } from "@/lib/data-paths";

const storageRoot = path.join(dataPaths.knowHub, "settings");
const storePath = path.join(storageRoot, "embedding.json");

async function ensureStorageDir() {
  await fs.mkdir(storageRoot, { recursive: true });
}

export async function readEmbeddingConfigStore() {
  await ensureStorageDir();

  try {
    const content = await fs.readFile(storePath, "utf8");
    const parsed = JSON.parse(content) as Partial<EmbeddingConfigRecord>;

    if (
      typeof parsed.baseUrl === "string" &&
      typeof parsed.apiKey === "string" &&
      typeof parsed.model === "string"
    ) {
      return {
        baseUrl: parsed.baseUrl,
        apiKey: parsed.apiKey,
        model: parsed.model,
        updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : null,
      } satisfies EmbeddingConfigRecord;
    }

    return null;
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

export async function writeEmbeddingConfigStore(store: EmbeddingConfigRecord) {
  await ensureStorageDir();
  await fs.writeFile(storePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}
