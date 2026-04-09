import "server-only";

import {
  readEmbeddingConfigStore,
  writeEmbeddingConfigStore,
} from "@/knowhub/features/settings/embedding/embedding-storage";
import type { EmbeddingConfigRecord } from "@/knowhub/features/settings/embedding/embedding-types";

function createDefaultConfig() {
  return {
    baseUrl: "",
    apiKey: "",
    model: "",
    updatedAt: null,
  } satisfies EmbeddingConfigRecord;
}

function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

export async function getEmbeddingConfig() {
  const stored = await readEmbeddingConfigStore();

  if (stored) {
    return stored;
  }

  const nextConfig = createDefaultConfig();
  await writeEmbeddingConfigStore(nextConfig);
  return nextConfig;
}

export async function saveEmbeddingConfig(input: {
  baseUrl: string;
  apiKey: string;
  model: string;
}) {
  const baseUrl = normalizeBaseUrl(input.baseUrl);
  const apiKey = input.apiKey.trim();
  const model = input.model.trim();

  if (!baseUrl) {
    throw new Error("Base URL 不能为空");
  }

  if (!apiKey) {
    throw new Error("API Key 不能为空");
  }

  if (!model) {
    throw new Error("模型名称不能为空");
  }

  const nextConfig = {
    baseUrl,
    apiKey,
    model,
    updatedAt: new Date().toISOString(),
  } satisfies EmbeddingConfigRecord;

  await writeEmbeddingConfigStore(nextConfig);
  return nextConfig;
}
