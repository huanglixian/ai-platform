import "server-only";

import { Buffer } from "buffer";

import {
  getStoredDocSpace,
  listStoredDocspaceItems,
  removeStoredDocSpace,
  saveStoredDocSpace,
  updateStoredDocSpace,
} from "@/knowhub/features/docspace/repository";
import {
  createFileSnapshot,
  ensureHostedDocSpacePath,
  listHostedDocSpaceFiles,
  removeHostedDocSpacePath,
  writeHostedDocSpaceFiles,
} from "@/knowhub/features/docspace/storage";
import {
  buildOssTarget,
  listOssFiles,
  testOssConnection,
} from "@/knowhub/features/docspace/oss-connector";
import {
  buildSmbTarget,
  listSmbFiles,
  testSmbConnection,
} from "@/knowhub/features/docspace/smb-connector";
import type {
  CreateDocSpaceInput,
  DocSpaceFileSnapshot,
  DocSpaceRecord,
  DocSpaceSource,
  StoredDocSpace,
  TestDocSpaceConnectionInput,
} from "@/knowhub/features/docspace/types";

function formatBytes(bytes: number) {
  if (bytes <= 0) {
    return "0 MB";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const digits = unitIndex === 0 ? 0 : value >= 100 ? 0 : 1;
  return `${value.toFixed(digits)} ${units[unitIndex]}`;
}

function formatDateLabel(value?: string) {
  if (!value) {
    return "未同步";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(date)
    .replace(/\//g, "-");
}

function buildConnectedTarget(source: DocSpaceSource) {
  if (source.type === "hosted") {
    return "平台托管空间";
  }

  if (source.type === "oss") {
    return buildOssTarget(source);
  }

  return buildSmbTarget(source);
}

function buildFileSnapshots(
  files: Array<{
    name: string;
    path: string;
    sizeBytes: number;
    updatedAt: string;
  }>,
): DocSpaceFileSnapshot[] {
  return files.map((file) => ({
    id: file.path,
    name: file.name,
    path: file.path,
    sizeBytes: file.sizeBytes,
    sizeLabel: formatBytes(file.sizeBytes),
    updatedAt: formatDateLabel(file.updatedAt),
    statusLabel: "已发现",
  }));
}

function buildFolderCount(files: DocSpaceFileSnapshot[]) {
  const folders = new Set(
    files
      .map((file) => file.path.split("/").slice(0, -1).join("/"))
      .filter((item) => item && item !== "/"),
  );

  return folders.size;
}

function toDocSpaceRecord(docspace: StoredDocSpace): DocSpaceRecord {
  const totalSizeBytes = docspace.files.reduce(
    (sum, file) => sum + file.sizeBytes,
    0,
  );

  return {
    id: docspace.id,
    name: docspace.name,
    summary: docspace.summary,
    sourceType: docspace.source.type,
    status: docspace.status,
    documentCount: docspace.files.length,
    folderCount: buildFolderCount(docspace.files),
    totalSizeBytes,
    totalSizeLabel: formatBytes(totalSizeBytes),
    connectedTarget: buildConnectedTarget(docspace.source),
    owner: docspace.owner,
    lastSyncAt: formatDateLabel(docspace.lastSyncAt),
    files: docspace.files,
  };
}

async function testRemoteConnection(source: TestDocSpaceConnectionInput["source"]) {
  if (source.type === "oss") {
    return testOssConnection(source);
  }

  return testSmbConnection(source);
}

async function collectDocSpaceFiles(docspace: StoredDocSpace) {
  if (docspace.source.type === "hosted") {
    const files = await listHostedDocSpaceFiles(docspace.id);
    return buildFileSnapshots(files.map(createFileSnapshot));
  }

  if (docspace.source.type === "oss") {
    return buildFileSnapshots(await listOssFiles(docspace.source));
  }

  return buildFileSnapshots(await listSmbFiles(docspace.source));
}

export async function listDocspaceItems() {
  const items = await listStoredDocspaceItems();
  return items.map(toDocSpaceRecord);
}

async function createDocSpaceId() {
  const existing = await listStoredDocspaceItems();
  let nextId = `docspace_${Date.now().toString(36)}`;
  let index = 2;

  while (existing.some((item) => item.id === nextId)) {
    nextId = `docspace_${Date.now().toString(36)}_${index}`;
    index += 1;
  }

  return nextId;
}

export async function getDocSpaceById(id: string) {
  const docspace = await getStoredDocSpace(id);

  if (!docspace) {
    return null;
  }

  return toDocSpaceRecord(docspace);
}

export async function listDocSpaceFiles(id: string) {
  const docspace = await getStoredDocSpace(id);

  if (!docspace) {
    return null;
  }

  return docspace.files;
}

export async function testDocSpaceConnection(input: TestDocSpaceConnectionInput) {
  return testRemoteConnection(input.source);
}

export async function createDocSpace(input: CreateDocSpaceInput) {
  const name = input.name.trim();
  const summary = input.summary.trim();

  if (!name) {
    throw new Error("请输入空间名称");
  }

  if (input.source.type !== "hosted") {
    await testRemoteConnection(input.source);
  }

  const id = await createDocSpaceId();
  const now = new Date().toISOString();
  const source =
    input.source.type === "hosted"
      ? {
          type: "hosted" as const,
          managedPath: await ensureHostedDocSpacePath(id),
        }
      : input.source;

  const storedDocspace: StoredDocSpace = {
    id,
    name,
    summary,
    owner: "未设置",
    status: source.type === "hosted" ? "empty" : "syncing",
    source,
    files: [],
    createdAt: now,
    updatedAt: now,
  };

  await saveStoredDocSpace(storedDocspace);

  if (source.type === "hosted") {
    return toDocSpaceRecord(storedDocspace);
  }

  const syncedDocspace = await syncDocSpace(id);

  if (!syncedDocspace) {
    throw new Error("创建空间后同步失败");
  }

  return syncedDocspace;
}

export async function syncDocSpace(id: string) {
  const pendingDocspace = await updateStoredDocSpace(id, (docspace) => ({
    ...docspace,
    status: "syncing",
    updatedAt: new Date().toISOString(),
  }));

  if (!pendingDocspace) {
    return null;
  }

  try {
    const files = await collectDocSpaceFiles(pendingDocspace);
    const now = new Date().toISOString();
    const nextDocspace = await updateStoredDocSpace(id, (docspace) => ({
      ...docspace,
      files,
      status: files.length ? "ready" : "empty",
      updatedAt: now,
      lastSyncAt: now,
      lastSyncMessage: "同步完成",
    }));

    return nextDocspace ? toDocSpaceRecord(nextDocspace) : null;
  } catch (error) {
    const message = error instanceof Error ? error.message : "同步失败";
    const failedDocspace = await updateStoredDocSpace(id, (docspace) => ({
      ...docspace,
      status: "failed",
      updatedAt: new Date().toISOString(),
      lastSyncMessage: message,
    }));

    if (!failedDocspace) {
      return null;
    }

    throw new Error(message);
  }
}

export async function deleteDocSpace(id: string) {
  const docspace = await removeStoredDocSpace(id);

  if (!docspace) {
    return null;
  }

  if (docspace.source.type === "hosted") {
    await removeHostedDocSpacePath(id);
  }

  return toDocSpaceRecord(docspace);
}

export async function uploadDocSpaceFiles(
  id: string,
  files: Array<{
    name: string;
    content: Buffer;
  }>,
) {
  if (!files.length) {
    throw new Error("请选择要上传的文件");
  }

  const docspace = await getStoredDocSpace(id);

  if (!docspace) {
    return null;
  }

  if (docspace.source.type !== "hosted") {
    throw new Error("只有本地空间支持上传文件");
  }

  await writeHostedDocSpaceFiles(id, files);
  return syncDocSpace(id);
}
