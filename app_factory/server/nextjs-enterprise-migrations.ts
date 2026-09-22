import { getAppRuntime } from "@/app_factory/runtimes";
import type { RuntimeId } from "@/app_factory/runtimes/types";
import { runWorkspaceExecutable } from "@/app_factory/server/workspace";

function migrationFailureMessage(output: string, databaseUrl: string) {
  return output.replaceAll(databaseUrl, "[REDACTED]").trim().slice(-2_000);
}

export async function migrateNextjsEnterpriseWorkspace(
  workspacePath: string,
  runtimeId: RuntimeId,
  options: {
    nodeEnv: "development" | "production";
    signal?: AbortSignal;
  },
) {
  const runtime = getAppRuntime(runtimeId);
  const command = runtime.createMigrationCommand?.(workspacePath);
  if (!command) throw new Error("当前运行时不支持 Next.js 企业应用数据库迁移");

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) throw new Error("企业应用数据库迁移需要由宿主提供 DATABASE_URL");

  const result = await runWorkspaceExecutable(
    command.cwd,
    command.executable,
    command.args,
    120_000,
    {
      nodeEnv: options.nodeEnv,
      signal: options.signal,
      environment: { DATABASE_URL: databaseUrl },
    },
  );
  if (result.code !== 0) {
    const detail = migrationFailureMessage(`${result.stdout}${result.stderr}`, databaseUrl);
    throw new Error(detail ? `数据库迁移失败：${detail}` : "数据库迁移失败");
  }
}
