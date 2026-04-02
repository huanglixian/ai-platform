export type KnowHubNavKey =
  | "overview"
  | "documents"
  | "strategies"
  | "knowledge";

export type DocSpaceSourceType = "manual" | "ftp" | "oss";

export type DocSpaceStatus = "empty" | "ready" | "syncing";

export interface DocSpaceFileSnapshot {
  id: string;
  name: string;
  path: string;
  sizeLabel: string;
  updatedAt: string;
  statusLabel: string;
}

export interface DocSpaceRecord {
  id: string;
  name: string;
  summary: string;
  sourceType: DocSpaceSourceType;
  status: DocSpaceStatus;
  documentCount: number;
  folderCount: number;
  totalSizeLabel: string;
  connectedTarget: string;
  owner: string;
  lastSyncAt: string;
  files: DocSpaceFileSnapshot[];
}

export type StrategyCategory = "preprocess" | "chunking" | "extract";

export interface StrategyRecord {
  id: string;
  name: string;
  category: StrategyCategory;
  group: string;
  summary: string;
  metaLabel: string;
  metaValue: string;
  owner: string;
  usageCount: number;
}

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

export interface KnowHubOverviewStat {
  key: string;
  label: string;
  value: string;
  hint: string;
}

export interface KnowHubFlowStage {
  key: string;
  title: string;
  summary: string;
  metric: string;
}
