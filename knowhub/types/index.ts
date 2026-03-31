export type KnowHubNavKey =
  | "overview"
  | "documents"
  | "strategies"
  | "pipelines"
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
  knowledgeCount: number;
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
