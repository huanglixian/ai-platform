export type PipelineStatus = "draft" | "published" | "running";

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
  embeddingModel: string;
  knowledgeTarget: string;
  lastRunAt: string;
  runCount: number;
}
