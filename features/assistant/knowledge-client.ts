import type { RetrievalSearchResult } from "@/knowhub/features/retrieval/types";

export type KnowledgeOption = { id: string; name: string; status: string };

export async function listAssistantKnowledge() {
  const response = await fetch("/api/knowhub/knowledge", { cache: "no-store" });
  const payload = await response.json();
  if (!response.ok || !payload.ok || !Array.isArray(payload.items)) throw new Error(payload.error || "知识库加载失败");
  return (payload.items as KnowledgeOption[]).filter((item) => item.status === "published");
}

export async function searchAssistantKnowledge(knowledgeId: string, query: string): Promise<RetrievalSearchResult> {
  const response = await fetch("/api/knowhub/retrieval/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ knowledgeId, query }),
  });
  const payload = await response.json();
  if (!response.ok || !payload.ok || !payload.result) throw new Error(payload.error || "知识库搜索失败");
  return payload.result;
}
