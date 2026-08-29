import fs from "node:fs/promises";

import { validateProject } from "@/app_factory/contracts/validator";
import { buildRepository, releaseRepository } from "@/app_factory/server/repositories";
import { getProject, listCapabilityBindings } from "@/app_factory/server/database";
import { runWorkspaceCommand } from "@/app_factory/server/workspace";
import { apiError, apiOk } from "@/lib/server/api-response";

export const runtime = "nodejs";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const project = getProject(id);
  if (!project) return apiError("项目不存在", 404);
  const boundCapabilityIds = listCapabilityBindings(id).map((binding) => binding.capabilityId);
  const checks = await validateProject(project.workspacePath, { boundCapabilityIds });
  const build = buildRepository.create(id, "running", "contract", JSON.stringify(checks)) as { id: string };
  if (checks.some((check) => check.level === "error")) {
    buildRepository.update(build.id, "failed", "contract", JSON.stringify(checks));
    return apiOk({ id: build.id, status: "failed", checks });
  }
  let log = JSON.stringify(checks);
  try {
    const nextConfigPath = `${project.workspacePath}/next.config.ts`;
    const hasNextConfig = await fs.access(nextConfigPath).then(() => true).catch(() => false);
    if (!hasNextConfig) {
      await fs.writeFile(nextConfigPath, "const nextConfig = { output: \"standalone\" };\nexport default nextConfig;\n", "utf8");
      log += "\n[config]\n已启用 Next.js standalone 输出";
    }
    const hasPackage = await fs.access(`${project.workspacePath}/package.json`).then(() => true).catch(() => false);
    const stages = hasPackage ? [["lint", "eslint app"], ["typecheck", "npm run typecheck"], ["build", "npm run build"]] as const : [];
    for (const [stage, command] of stages) {
      buildRepository.update(build.id, "running", stage, log);
      const result = await runWorkspaceCommand(
        project.workspacePath,
        command,
        120_000,
        { nodeEnv: "production" },
      );
      log += `\n[${stage}]\n${result.stdout}\n${result.stderr}`;
      if (result.code !== 0) throw new Error(`${stage} 失败`);
    }
    const release = releaseRepository.create(id, build.id, "0.1.0", project.workspacePath);
    buildRepository.update(build.id, "completed", "done", log);
    return apiOk({ id: build.id, status: "completed", checks, release, log });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    buildRepository.update(build.id, "failed", "pipeline", `${log}\n${message}`);
    return apiOk({ id: build.id, status: "failed", checks, log: `${log}\n${message}` });
  }
}
