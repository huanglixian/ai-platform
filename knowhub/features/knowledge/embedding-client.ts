import "server-only";

import { getEmbeddingConfig } from "@/knowhub/features/settings/embedding/embedding-config-service";

export interface EmbeddingBatchResult {
  embeddings: number[][];
  model: string;
  dimension: number;
}

function joinUrl(baseUrl: string, pathname: string) {
  return `${baseUrl.replace(/\/+$/, "")}/${pathname.replace(/^\/+/, "")}`;
}

async function safeReadText(response: Response) {
  try {
    return await response.text();
  } catch {
    return "无法读取响应内容";
  }
}

export async function embedTexts(texts: string[]): Promise<EmbeddingBatchResult> {
  if (!texts.length) {
    return {
      embeddings: [],
      model: "",
      dimension: 0,
    };
  }

  const config = await getEmbeddingConfig();

  if (!config.baseUrl || !config.apiKey || !config.model) {
    throw new Error("Embedding 配置不完整，请先到配置管理填写 Base URL、API Key 和模型名称");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(joinUrl(config.baseUrl, "/embeddings"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        input: texts,
        model: config.model,
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await safeReadText(response);
      throw new Error(`向量化接口返回错误（${response.status}）：${errorText}`);
    }

    const payload = (await response.json()) as {
      data?: Array<{
        embedding?: number[];
      }>;
    };
    const items = payload.data ?? [];

    if (items.length !== texts.length) {
      throw new Error("向量化接口返回内容不完整，embedding 数量不匹配");
    }

    const embeddings = items.map((item) => {
      if (!Array.isArray(item.embedding) || !item.embedding.length) {
        throw new Error("向量化接口返回内容不完整，缺少 embedding 数组");
      }

      return item.embedding.map((value) => Number(value));
    });
    const dimension = embeddings[0]?.length ?? 0;

    if (!dimension) {
      throw new Error("向量化接口返回内容不完整，embedding 维度为空");
    }

    const invalidDimension = embeddings.some((embedding) => embedding.length !== dimension);

    if (invalidDimension) {
      throw new Error("向量化接口返回的 embedding 维度不一致");
    }

    return {
      embeddings,
      model: config.model,
      dimension,
    };
  } finally {
    clearTimeout(timeout);
  }
}
