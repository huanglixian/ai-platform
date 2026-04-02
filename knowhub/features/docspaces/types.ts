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
