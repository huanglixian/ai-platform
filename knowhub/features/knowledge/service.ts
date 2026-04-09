import "server-only";

import {
  getStoredKnowledgeById,
  listStoredKnowledgeItems,
  listStoredKnowledgeRuns,
  saveStoredKnowledge,
} from "@/knowhub/features/knowledge/repository";
import { runKnowledgeBuild } from "@/knowhub/features/knowledge/build-service";
import type {
  CreateKnowledgeInput,
  PipelineRecord,
} from "@/knowhub/features/knowledge/types";

function createKnowledgeId() {
  return `knowledge_${Date.now().toString(36)}`;
}

export async function listKnowledgeItems() {
  return listStoredKnowledgeItems();
}

export async function getKnowledgeById(id: string) {
  return getStoredKnowledgeById(id);
}

export async function listKnowledgeRuns(id: string) {
  return listStoredKnowledgeRuns(id);
}

export async function createKnowledge(input: CreateKnowledgeInput) {
  const name = input.name.trim();
  const summary = input.summary.trim();

  if (!name) {
    throw new Error("请输入知识库名称");
  }

  if (!input.docspaceIds.length) {
    throw new Error("至少选择一个文档空间");
  }

  const now = new Date().toISOString();
  const item: PipelineRecord = {
    id: createKnowledgeId(),
    name,
    summary: summary || "基于默认策略创建的知识库。",
    status: "draft",
    docspaceIds: input.docspaceIds,
    targetLabel: input.targetLabel,
    preprocessStrategyIds: input.preprocessStrategyIds,
    chunkingStrategyIds: input.chunkingStrategyIds,
    extractStrategyIds: input.extractStrategyIds,
    strategyPresetBindings: input.strategyPresetBindings,
    embeddingModel: input.embeddingModel,
    knowledgeTarget: input.knowledgeTarget,
    lastRunAt: "未启动",
    runCount: 0,
    vectorStoreName: "sqlite-vec",
    fileCount: 0,
    chunkCount: 0,
    vectorCount: 0,
    lastError: null,
    createdAt: now,
    updatedAt: now,
  };

  return saveStoredKnowledge(item);
}

export async function runKnowledge(id: string) {
  return runKnowledgeBuild(id);
}
