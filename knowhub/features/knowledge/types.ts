export type PipelineStatus = "draft" | "published" | "running" | "failed";

export type KnowledgeRunStatus = "running" | "succeeded" | "failed";

export interface StrategyPresetBinding {
  strategyId: string;
  presetId: string;
}

export interface CreateKnowledgeInput {
  name: string;
  summary: string;
  docspaceIds: string[];
  targetLabel: string;
  preprocessStrategyIds: string[];
  chunkingStrategyIds: string[];
  extractStrategyIds: string[];
  strategyPresetBindings: StrategyPresetBinding[];
  embeddingModel: string;
  knowledgeTarget: string;
}

export interface PipelineRecord {
  id: string;
  name: string;
  summary: string;
  status: PipelineStatus;
  docspaceIds: string[];
  targetLabel: string;
  preprocessStrategyIds: string[];
  chunkingStrategyIds: string[];
  extractStrategyIds: string[];
  strategyPresetBindings: StrategyPresetBinding[];
  embeddingModel: string;
  knowledgeTarget: string;
  lastRunAt: string;
  runCount: number;
  vectorStoreName: string;
  fileCount: number;
  chunkCount: number;
  vectorCount: number;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeRunRecord {
  id: string;
  knowledgeId: string;
  status: KnowledgeRunStatus;
  startedAt: string;
  finishedAt: string | null;
  fileCount: number;
  chunkCount: number;
  vectorCount: number;
  message: string;
}

export interface KnowledgeStore {
  items: PipelineRecord[];
}

export interface KnowledgeRunStore {
  items: KnowledgeRunRecord[];
}
