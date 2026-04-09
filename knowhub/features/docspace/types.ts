export type DocSpaceSourceType = "hosted" | "oss" | "smb";

export type DocSpaceStatus = "empty" | "ready" | "syncing" | "failed";

export interface DocSpaceFileSnapshot {
  id: string;
  name: string;
  path: string;
  sizeBytes: number;
  sizeLabel: string;
  updatedAt: string;
  statusLabel: string;
}

export interface DocSpaceFileContent {
  id: string;
  name: string;
  path: string;
  extension: string;
  sizeBytes: number;
  updatedAt: string;
  content: string;
}

export interface DocSpaceRecord {
  id: string;
  name: string;
  summary: string;
  sourceType: DocSpaceSourceType;
  status: DocSpaceStatus;
  documentCount: number;
  folderCount: number;
  totalSizeBytes: number;
  totalSizeLabel: string;
  connectedTarget: string;
  owner: string;
  lastSyncAt: string;
  files: DocSpaceFileSnapshot[];
}

export interface HostedDocSpaceSource {
  type: "hosted";
  managedPath: string;
}

export interface OssDocSpaceSource {
  type: "oss";
  endpoint: string;
  bucket: string;
  region: string;
  accessKeyId: string;
  accessKeySecret: string;
  prefix: string;
}

export interface SmbDocSpaceSource {
  type: "smb";
  host: string;
  port: number;
  shareName: string;
  basePath: string;
  username: string;
  password: string;
  domain?: string;
}

export type DocSpaceSource =
  | HostedDocSpaceSource
  | OssDocSpaceSource
  | SmbDocSpaceSource;

export interface StoredDocSpace {
  id: string;
  name: string;
  summary: string;
  owner: string;
  status: DocSpaceStatus;
  source: DocSpaceSource;
  files: DocSpaceFileSnapshot[];
  createdAt: string;
  updatedAt: string;
  lastSyncAt?: string;
  lastSyncMessage?: string;
}

export interface DocSpaceStore {
  items: StoredDocSpace[];
}

export interface CreateHostedDocSpaceInput {
  name: string;
  summary: string;
  source: {
    type: "hosted";
  };
}

export interface CreateOssDocSpaceInput {
  name: string;
  summary: string;
  source: OssDocSpaceSource;
}

export interface CreateSmbDocSpaceInput {
  name: string;
  summary: string;
  source: SmbDocSpaceSource;
}

export type CreateDocSpaceInput =
  | CreateHostedDocSpaceInput
  | CreateOssDocSpaceInput
  | CreateSmbDocSpaceInput;

export type TestDocSpaceConnectionInput =
  | {
      source: OssDocSpaceSource;
    }
  | {
      source: SmbDocSpaceSource;
    };

export interface TestDocSpaceConnectionResult {
  ok: boolean;
  message: string;
  connectedTarget: string;
}
