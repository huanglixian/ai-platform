export interface WorkbenchKnowledgeOption {
  id: string;
  name: string;
  status: string;
  embeddingModel: string;
  lastRunAt: string;
}

export interface WorkbenchSearchItem {
  knowledgeId: string;
  filePath: string;
  fileName: string;
  headingTitle: string | null;
  parentHeadings: Array<{
    title: string;
    level: number;
  }>;
  startLine: number;
  endLine: number;
  content: string;
  score: number;
}

export interface WorkbenchSearchResult {
  query: string;
  knowledgeId: string;
  items: WorkbenchSearchItem[];
}

export type WorkbenchChatMessage = {
  id?: string;
  role: "user" | "assistant";
  content: string;
};

type ApiResponse<T> = T & {
  ok: boolean;
  error?: string;
};

async function fetchJson<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
  });
  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.ok) {
    throw new Error(payload.error || "请求失败");
  }

  return payload;
}

export async function listWorkbenchKnowledgeOptions() {
  const payload = await fetchJson<{
    items?: WorkbenchKnowledgeOption[];
  }>("/api/knowhub/knowledge");

  return (payload.items ?? []).filter((item) => item.status === "published");
}

export async function searchWorkbenchKnowledge(input: {
  knowledgeId: string;
  query: string;
  limit?: number;
}) {
  const payload = await fetchJson<{
    result?: WorkbenchSearchResult;
  }>("/api/knowhub/retrieval/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!payload.result) {
    throw new Error("检索结果为空");
  }

  return payload.result;
}

export async function streamWorkbenchChat(
  messages: WorkbenchChatMessage[],
  runtimeState?: {
    activeSkillId?: string;
    skillStatus?: string;
  },
  handlers: {
    onDelta?: (delta: string) => void;
  } = {},
) {
  const response = await fetch("/api/platform/workbench/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify({ messages, runtimeState }),
  });

  if (!response.ok) {
    try {
      const payload = (await response.json()) as ApiResponse<Record<string, unknown>>;
      throw new Error(payload.error || "工作台 AI 回复失败");
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("工作台 AI 回复失败");
    }
  }

  if (!response.body) {
    throw new Error("后端未返回流式响应");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let content = "";

  while (true) {
    const { value, done } = await reader.read();
    const delta = decoder.decode(value || new Uint8Array(), { stream: !done });

    if (delta) {
      content += delta;
      handlers.onDelta?.(delta);
    }

    if (done) {
      break;
    }
  }

  return content;
}
