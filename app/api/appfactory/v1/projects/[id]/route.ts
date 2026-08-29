import { apiError, apiOk } from "@/lib/server/api-response";
import { getProject } from "@/app_factory/server/database";

export const runtime = "nodejs";

export async function GET(
  _: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const project = getProject(id);
  if (!project) return apiError("项目不存在", 404);
  return apiOk(project);
}
