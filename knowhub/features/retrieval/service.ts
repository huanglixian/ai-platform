import "server-only";

import { embedTexts } from "@/knowhub/features/knowledge/embedding-client";
import { getKnowledgeById } from "@/knowhub/features/knowledge/service";
import { getVectorStore } from "@/knowhub/features/vector-store";
import type { RetrievalSearchResult } from "@/knowhub/features/retrieval/types";
import type { StrategyHeadingMetadata } from "@/knowhub/features/strategies/types";

function parseParentHeadings(value: string) {
  try {
    const parsed = JSON.parse(value) as StrategyHeadingMetadata[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toScore(distance: number) {
  return Number((1 / (1 + Math.max(distance, 0))).toFixed(4));
}

export async function searchKnowledgeSlices(input: {
  knowledgeId: string;
  query: string;
  limit?: number;
}): Promise<RetrievalSearchResult> {
  const query = input.query.trim();

  if (!query) {
    throw new Error("请输入检索问题");
  }

  const knowledge = await getKnowledgeById(input.knowledgeId);

  if (!knowledge) {
    throw new Error("未找到对应知识库");
  }

  if (knowledge.status !== "published") {
    throw new Error("当前知识库尚未完成建库，暂时无法检索");
  }

  const embeddingResult = await embedTexts([query]);
  const vectorStore = await getVectorStore(embeddingResult.dimension);
  const rows = vectorStore.searchByEmbedding(
    input.knowledgeId,
    embeddingResult.embeddings[0],
    input.limit ?? 8,
  );

  return {
    query,
    knowledgeId: input.knowledgeId,
    items: rows.map((row) => ({
      knowledgeId: row.knowledgeId,
      filePath: row.filePath,
      fileName: row.fileName,
      headingTitle: row.headingTitle,
      parentHeadings: parseParentHeadings(row.parentHeadingsJson),
      startLine: row.startLine,
      endLine: row.endLine,
      content: row.content,
      score: toScore(row.distance),
    })),
  };
}
