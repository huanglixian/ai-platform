import { getProject, hasActiveRunForProject } from "@/app_factory/server/database";
import {
  getPreview,
  PreviewStartError,
  startPreview,
  stopPreview,
} from "@/app_factory/server/preview";
import { apiError, apiOk } from "@/lib/server/api-response";

export const runtime = "nodejs";

export async function GET(
  _: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return apiOk(getPreview(id));
}

export async function POST(
  _: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const project = getProject(id);
  if (!project) return apiError("项目不存在", 404);
  if (hasActiveRunForProject(id)) return apiError("Pi 正在修改项目，完成后再预览", 409);
  try {
    return apiOk(await startPreview(id, project.workspacePath, project.template.runtimeId));
  } catch (error) {
    if (error instanceof PreviewStartError) {
      return apiError(error.message, 502, { logs: error.logs });
    }
    throw error;
  }
}

export async function DELETE(
  _: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return await stopPreview(id)
    ? apiOk({ status: "stopped" })
    : apiError("Preview 未运行", 404);
}
