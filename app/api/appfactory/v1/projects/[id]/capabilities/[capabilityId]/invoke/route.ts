import { apiError, apiOk } from "@/lib/server/api-response";
import { createAgentHubClient } from "@/app_factory/features/agenthub-client";
import { getProject, listCapabilityBindings } from "@/app_factory/server/database";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string; capabilityId: string }> }) {
  const { id, capabilityId } = await context.params;
  const project = getProject(id);
  if (!project) return apiError("项目不存在", 404);
  const isBound = listCapabilityBindings(id).some((binding) => binding.capabilityId === capabilityId);
  if (!isBound) return apiError("能力未绑定到当前项目", 409);
  let input: unknown;
  try { input = (await request.json()).input; } catch { return apiError("调用参数格式错误", 422); }
  try { return apiOk(await createAgentHubClient(project.agentHubMode as "disabled" | "local" | "http").invokeCapability(capabilityId, input)); }
  catch (error) { return apiError(error instanceof Error ? error.message : "能力调用失败", 502); }
}
