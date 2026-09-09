import fs from "node:fs/promises";
import path from "node:path";

import { runWorkspaceCommand } from "@/app_factory/server/workspace";

export type ReleaseBuildLog = {
  stage: "lint" | "typecheck" | "build" | "package";
  output: string;
};

type BuildOptions = {
  onLog: (log: ReleaseBuildLog) => void;
  signal?: AbortSignal;
};

async function copyIfExists(source: string, destination: string) {
  const exists = await fs.access(source).then(() => true).catch(() => false);
  if (exists) await fs.cp(source, destination, { recursive: true });
}

export async function buildStandaloneRelease(
  workspacePath: string,
  releasePath: string,
  options: BuildOptions,
) {
  const commands = [
    ["lint", "npm run lint"],
    ["typecheck", "npm run typecheck"],
    ["build", "npm run build"],
  ] as const;
  for (const [stage, command] of commands) {
    const result = await runWorkspaceCommand(workspacePath, command, 120_000, {
      nodeEnv: "production",
      signal: options.signal,
    });
    const output = `${result.stdout}${result.stderr}`.trim();
    options.onLog({ stage, output: output || `${stage} 已完成` });
    if (result.code !== 0) throw new Error(`${stage} 失败`);
  }

  const standalone = path.join(workspacePath, ".next", "standalone");
  const hasStandalone = await fs.access(path.join(standalone, "server.js"))
    .then(() => true)
    .catch(() => false);
  if (!hasStandalone) {
    throw new Error("构建产物缺少 Next.js standalone server.js");
  }

  await fs.mkdir(path.dirname(releasePath), { recursive: true });
  await fs.mkdir(releasePath);
  await fs.cp(standalone, releasePath, { recursive: true });
  await copyIfExists(
    path.join(workspacePath, ".next", "static"),
    path.join(releasePath, ".next", "static"),
  );
  await copyIfExists(path.join(workspacePath, "public"), path.join(releasePath, "public"));
  options.onLog({ stage: "package", output: "已生成独立的 Next.js standalone Release" });
}
