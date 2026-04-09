import type {
  CreateKnowledgeInput,
  KnowledgeRunRecord,
  PipelineRecord,
} from "@/knowhub/features/knowledge/types";

type ApiResponse<T> = T & {
  ok: boolean;
  error?: string;
};

async function fetchKnowledgeApi<T>(path: string, init?: RequestInit) {
  const response = await fetch(`/api/knowhub/knowledge${path}`, {
    ...init,
    cache: "no-store",
  });

  let data: ApiResponse<T>;

  try {
    data = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new Error("响应格式不正确");
  }

  if (!response.ok || !data.ok) {
    throw new Error(data.error || `请求失败：${response.status}`);
  }

  return data;
}

export async function createKnowledgeApi(payload: CreateKnowledgeInput) {
  const data = await fetchKnowledgeApi<{ item: PipelineRecord }>("", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return data.item;
}

export async function runKnowledgeApi(id: string) {
  const data = await fetchKnowledgeApi<{
    item: PipelineRecord;
    run: KnowledgeRunRecord;
  }>(`/${encodeURIComponent(id)}/run`, {
    method: "POST",
  });

  return data;
}
