import "server-only";

import OSS from "ali-oss";

import type { OssDocSpaceSource } from "@/knowhub/features/docspace/types";

type RemoteFileEntry = {
  name: string;
  path: string;
  sizeBytes: number;
  updatedAt: string;
};

function createOssClient(source: OssDocSpaceSource) {
  const normalizedEndpoint = source.endpoint.trim();

  return new OSS({
    endpoint: normalizedEndpoint
      ? normalizedEndpoint.startsWith("http://") ||
        normalizedEndpoint.startsWith("https://")
        ? normalizedEndpoint
        : `https://${normalizedEndpoint}`
      : undefined,
    region: source.region || undefined,
    bucket: source.bucket,
    accessKeyId: source.accessKeyId,
    accessKeySecret: source.accessKeySecret,
  });
}

function normalizePrefix(prefix: string) {
  return prefix.replace(/^\/+/, "").replace(/\/+$/, "");
}

export function buildOssTarget(source: OssDocSpaceSource) {
  const prefix = normalizePrefix(source.prefix);
  return prefix ? `oss://${source.bucket}/${prefix}` : `oss://${source.bucket}`;
}

export async function testOssConnection(source: OssDocSpaceSource) {
  const client = createOssClient(source);
  const prefix = normalizePrefix(source.prefix);

  await client.list({
    prefix: prefix || undefined,
    "max-keys": 1,
  });

  return {
    ok: true,
    message: "OSS 连接成功",
    connectedTarget: buildOssTarget(source),
  };
}

export async function listOssFiles(source: OssDocSpaceSource) {
  const client = createOssClient(source);
  const prefix = normalizePrefix(source.prefix);
  const files: RemoteFileEntry[] = [];
  let marker = "";

  while (true) {
    const result = await client.list({
      prefix: prefix || undefined,
      marker: marker || undefined,
      "max-keys": 1000,
    });

    for (const objectItem of result.objects || []) {
      if (!objectItem.name || objectItem.name.endsWith("/")) {
        continue;
      }

      const relativePath = prefix
        ? objectItem.name.replace(new RegExp(`^${prefix}/?`), "")
        : objectItem.name;

      files.push({
        name: relativePath.split("/").pop() || relativePath,
        path: `/${relativePath}`,
        sizeBytes: Number(objectItem.size || 0),
        updatedAt: objectItem.lastModified || new Date().toISOString(),
      });
    }

    if (!result.isTruncated) {
      break;
    }

    marker = result.nextMarker || "";
  }

  return files;
}
