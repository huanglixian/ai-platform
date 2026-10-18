import { withApiAuth } from "@/features/auth/api";
import { apiError, apiOk } from "@/lib/server/api-response";
import { getProject } from "@/app_factory/server/database";

export const runtime = "nodejs";

async function handleGET(
  _: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const project = getProject(id);
  if (!project) return apiError("项目不存在", 404);
  return apiOk(project);
}

export const GET = withApiAuth(handleGET);
