import fs from "node:fs/promises";
import path from "node:path";

import {
  getReleaseStagingPath,
  materializeRuntimeWorkspace,
  seedWorkspaceRuntimeDependencies,
} from "@/app_factory/server/runtime-workspace";
import { runWorkspaceCommand } from "@/app_factory/server/workspace";

import type { AppRuntime, RuntimeBuildOptions } from "./types";

async function copyIfExists(source: string, destination: string) {
  const exists = await fs.access(source).then(() => true).catch(() => false);
  if (exists) await fs.cp(source, destination, { recursive: true });
}

async function buildRelease(
  workspacePath: string,
  releasePath: string,
  options: RuntimeBuildOptions,
) {
  const stagingPath = getReleaseStagingPath(releasePath);
  try {
    await materializeRuntimeWorkspace(workspacePath, stagingPath);
    if (options.enterprise) {
      seedWorkspaceRuntimeDependencies(stagingPath, { includeToolchain: true });
    }
    const commands = [
      ["lint", "npm run lint"],
      ["typecheck", "npm run typecheck"],
      ["build", "npm run build"],
    ] as const;
    for (const [stage, command] of commands) {
      const result = await runWorkspaceCommand(stagingPath, command, 120_000, {
        nodeEnv: "production",
        signal: options.signal,
      });
      const output = `${result.stdout}${result.stderr}`.trim();
      options.onLog({ stage, output: output || `${stage} 已完成` });
      if (result.code !== 0) throw new Error(`${stage} 失败`);
    }

    const standalone = path.join(stagingPath, ".next", "standalone");
    const server = path.join(standalone, "server.js");
    const exists = await fs.access(server).then(() => true).catch(() => false);
    if (!exists) throw new Error("构建产物缺少 Next.js standalone server.js");

    await fs.mkdir(path.dirname(releasePath), { recursive: true });
    await fs.mkdir(releasePath);
    await fs.cp(standalone, releasePath, { recursive: true, dereference: true });
    await copyIfExists(path.join(stagingPath, ".next", "static"), path.join(releasePath, ".next", "static"));
    await copyIfExists(path.join(stagingPath, "public"), path.join(releasePath, "public"));
    if (options.enterprise) {
      await copyIfExists(path.join(stagingPath, "src", "server"), path.join(releasePath, "src", "server"));
      await copyIfExists(path.join(stagingPath, "db"), path.join(releasePath, "db"));
      await copyIfExists(path.join(stagingPath, "worker"), path.join(releasePath, "worker"));
      await copyIfExists(path.join(stagingPath, ".appfactory-framework.json"), path.join(releasePath, ".appfactory-framework.json"));
      await copyIfExists(path.join(stagingPath, "app.yaml"), path.join(releasePath, "app.yaml"));
      seedWorkspaceRuntimeDependencies(releasePath, { includeTypes: false });
    }
    options.onLog({ stage: "package", output: "已生成独立的 Next.js standalone Release" });
  } finally {
    await fs.rm(stagingPath, { recursive: true, force: true });
  }
}

export const nextjsRuntime: AppRuntime = {
  id: "nextjs",
  applicationRuntime: "nextjs",
  createPreviewCommand(workspacePath, port) {
    return {
      executable: process.execPath,
      args: [
        path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next"),
        "dev",
        "--webpack",
        "--port",
        String(port),
      ],
      cwd: workspacePath,
    };
  },
  buildRelease,
  createReleaseCommand(releasePath) {
    return {
      executable: process.execPath,
      args: [path.join(releasePath, "server.js")],
      cwd: releasePath,
    };
  },
  createWorkerCommand(releasePath, workerEntry) {
    return {
      executable: process.execPath,
      args: ["--experimental-strip-types", workerEntry],
      cwd: releasePath,
    };
  },
  createMigrationCommand(releasePath) {
    return {
      executable: process.execPath,
      args: ["--experimental-strip-types", "src/server/db/migrate-cli.ts"],
      cwd: releasePath,
    };
  },
};
