import "server-only";

import { Buffer } from "buffer";

import SMB2 from "smb2";

import type { SmbDocSpaceSource } from "@/knowhub/features/docspace/types";

type RemoteFileEntry = {
  name: string;
  path: string;
  sizeBytes: number;
  updatedAt: string;
};

type SmbStat = {
  size: number;
  mtime: Date;
  isDirectory: () => boolean;
  isFile: () => boolean;
};

type SmbClient = {
  readdir: (path: string, callback: (error: Error | null, files?: string[]) => void) => void;
  stat: (path: string, callback: (error: Error | null, stat?: SmbStat) => void) => void;
  readFile: (
    path: string,
    options: { encoding?: BufferEncoding },
    callback: (error: Error | null, content?: string | Buffer) => void,
  ) => void;
  disconnect: () => void;
};

function createSmbClient(source: SmbDocSpaceSource) {
  return new SMB2({
    share: `\\\\${source.host}\\${source.shareName}`,
    domain: source.domain,
    username: source.username,
    password: source.password,
    port: source.port,
    autoCloseTimeout: 1000,
  }) as unknown as SmbClient;
}

function normalizeSmbPath(pathname: string) {
  return pathname
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
}

function toWindowsPath(pathname: string) {
  const normalized = normalizeSmbPath(pathname);
  return normalized ? normalized.split("/").join("\\") : "";
}

function readdir(client: SmbClient, pathname: string) {
  return new Promise<string[]>((resolve, reject) => {
    client.readdir(pathname, (error, files) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(files || []);
    });
  });
}

function stat(client: SmbClient, pathname: string) {
  return new Promise<SmbStat>((resolve, reject) => {
    client.stat(pathname, (error, nextStat) => {
      if (error || !nextStat) {
        reject(error || new Error("无法读取 SMB 文件信息"));
        return;
      }

      resolve(nextStat);
    });
  });
}

function readFile(
  client: SmbClient,
  pathname: string,
  options?: { encoding?: BufferEncoding },
) {
  return new Promise<string | Buffer>((resolve, reject) => {
    client.readFile(pathname, options ?? {}, (error, content) => {
      if (error || content === undefined) {
        reject(error || new Error("无法读取 SMB 文件内容"));
        return;
      }

      resolve(content);
    });
  });
}

async function walkSmbDirectory(
  client: SmbClient,
  currentPath: string,
  files: RemoteFileEntry[],
) {
  const entries = await readdir(client, currentPath);

  for (const entry of entries) {
    const entryPath = currentPath ? `${currentPath}\\${entry}` : entry;
    const entryStat = await stat(client, entryPath);

    if (entryStat.isDirectory()) {
      await walkSmbDirectory(client, entryPath, files);
      continue;
    }

    if (!entryStat.isFile()) {
      continue;
    }

    const displayPath = `/${entryPath.split("\\").join("/")}`;

    files.push({
      name: entry,
      path: displayPath,
      sizeBytes: entryStat.size,
      updatedAt: entryStat.mtime.toISOString(),
    });
  }
}

export function buildSmbTarget(source: SmbDocSpaceSource) {
  const basePath = normalizeSmbPath(source.basePath);
  return basePath
    ? `smb://${source.host}/${source.shareName}/${basePath}`
    : `smb://${source.host}/${source.shareName}`;
}

export async function testSmbConnection(source: SmbDocSpaceSource) {
  const client = createSmbClient(source);

  try {
    await readdir(client, toWindowsPath(source.basePath));
    return {
      ok: true,
      message: "SMB 连接成功",
      connectedTarget: buildSmbTarget(source),
    };
  } finally {
    client.disconnect();
  }
}

export async function listSmbFiles(source: SmbDocSpaceSource) {
  const client = createSmbClient(source);
  const files: RemoteFileEntry[] = [];

  try {
    await walkSmbDirectory(client, toWindowsPath(source.basePath), files);
    return files;
  } finally {
    client.disconnect();
  }
}

export async function readSmbFileText(source: SmbDocSpaceSource, filePath: string) {
  const client = createSmbClient(source);
  const basePath = normalizeSmbPath(source.basePath);
  const relativePath = normalizeSmbPath(filePath);
  const resolvedPath = [basePath, relativePath].filter(Boolean).join("/");

  try {
    const content = await readFile(client, toWindowsPath(resolvedPath), {
      encoding: "utf8",
    });

    return typeof content === "string" ? content : Buffer.from(content).toString("utf8");
  } finally {
    client.disconnect();
  }
}
