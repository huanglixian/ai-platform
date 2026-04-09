import "server-only";

import { promises as fs } from "fs";
import path from "path";

import { readOssFileText } from "@/knowhub/features/docspace/oss-connector";
import { readSmbFileText } from "@/knowhub/features/docspace/smb-connector";
import type { StoredDocSpace } from "@/knowhub/features/docspace/types";

function normalizeDocSpaceFilePath(filePath: string) {
  const normalized = filePath.trim().replace(/\\/g, "/");

  if (!normalized) {
    throw new Error("文件路径不能为空");
  }

  const withLeadingSlash = normalized.startsWith("/") ? normalized : `/${normalized}`;
  return withLeadingSlash.replace(/\/{2,}/g, "/");
}

function assertMarkdownFile(filePath: string) {
  if (path.extname(filePath).toLowerCase() !== ".md") {
    throw new Error("当前仅支持读取 Markdown 文件");
  }
}

function resolveHostedFilePath(rootPath: string, filePath: string) {
  const relativePath = normalizeDocSpaceFilePath(filePath).replace(/^\/+/, "");
  const resolvedRoot = path.resolve(rootPath);
  const resolvedFilePath = path.resolve(resolvedRoot, relativePath);

  if (
    resolvedFilePath !== resolvedRoot &&
    !resolvedFilePath.startsWith(`${resolvedRoot}${path.sep}`)
  ) {
    throw new Error("文件路径非法");
  }

  return resolvedFilePath;
}

async function readHostedFileText(rootPath: string, filePath: string) {
  const targetPath = resolveHostedFilePath(rootPath, filePath);
  return fs.readFile(targetPath, "utf8");
}

export function normalizeReadableDocSpacePath(filePath: string) {
  const normalizedPath = normalizeDocSpaceFilePath(filePath);
  assertMarkdownFile(normalizedPath);
  return normalizedPath;
}

export async function readStoredDocSpaceFileContent(
  docspace: StoredDocSpace,
  filePath: string,
) {
  const normalizedPath = normalizeReadableDocSpacePath(filePath);

  if (docspace.source.type === "hosted") {
    return readHostedFileText(docspace.source.managedPath, normalizedPath);
  }

  if (docspace.source.type === "oss") {
    return readOssFileText(docspace.source, normalizedPath);
  }

  return readSmbFileText(docspace.source, normalizedPath);
}
