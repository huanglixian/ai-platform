import fs from "node:fs/promises";
import path from "node:path";

import type { AppRuntime, RuntimeBuildOptions } from "./types";

const staticServerPath = path.join(
  process.cwd(),
  "app_factory",
  "runtimes",
  "static-server.mjs",
);

async function buildRelease(
  workspacePath: string,
  releasePath: string,
  options: RuntimeBuildOptions,
) {
  const publicPath = path.join(workspacePath, "public");
  const hasPublicPath = await fs.access(publicPath).then(() => true).catch(() => false);
  if (!hasPublicPath) throw new Error("纯 HTML 模板缺少 public 目录");
  await fs.mkdir(path.dirname(releasePath), { recursive: true });
  await fs.cp(publicPath, releasePath, { recursive: true });
  options.onLog({ stage: "package", output: "已生成静态网站 Release" });
}

function staticCommand(rootPath: string, port: number) {
  return {
    executable: process.execPath,
    args: [staticServerPath, rootPath, String(port)],
    cwd: rootPath,
  };
}

export const staticWebRuntime: AppRuntime = {
  id: "static-web",
  applicationRuntime: "static-web",
  createPreviewCommand(workspacePath, port) {
    return staticCommand(path.join(workspacePath, "public"), port);
  },
  buildRelease,
  createReleaseCommand(releasePath, port) {
    return staticCommand(releasePath, port);
  },
};
