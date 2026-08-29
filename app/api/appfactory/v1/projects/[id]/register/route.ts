import { apiError, apiOk } from "@/lib/server/api-response";
import { getProject } from "@/app_factory/server/database";
import { createAgentHubClient } from "@/app_factory/features/agenthub-client";
import { deploymentRepository, releaseRepository } from "@/app_factory/server/repositories";

export const runtime="nodejs";

export async function POST(
  _: Request,
  c: { params: Promise<{ id: string }> },
) {
  const { id } = await c.params;
  const project = getProject(id);
  if (!project) return apiError("项目不存在", 404);
  if (project.agentHubMode === "disabled") {
    return apiError("当前项目未启用 AgentHub 集成", 409);
  }
  const release = releaseRepository.latest(id) as {
    id: string;
    version: string;
  } | null;
  if (!release) return apiError("没有可注册的 Release", 409);
  const deployment = deploymentRepository.latest(id) as {
    release_id: string;
    status: string;
    url: string | null;
  } | null;
  if (
    !deployment ||
    deployment.release_id !== release.id ||
    deployment.status !== "running" ||
    !deployment.url
  ) {
    return apiError("请先完成当前 Release 的本地发布并通过健康检查", 409);
  }
  try {
    const registered = await createAgentHubClient(
      project.agentHubMode as "disabled" | "local" | "http",
    ).registerApplication({
      name: project.name,
      description: project.description,
      producer: "appfactory",
      kind: "application",
      runtime: "nextjs",
      status: "active",
      entryUrl: deployment.url,
      version: release.version,
      externalId: id,
    });
    return apiOk({ registered: true, application: registered });
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "AgentHub 注册失败", 502);
  }
}
