import { withApiAuth } from "@/features/auth/api";
import { getProject, hasActiveRunForProject } from "@/app_factory/server/database";
import {
  getPreview,
  PreviewStartError,
  startPreview,
  stopPreview,
} from "@/app_factory/server/preview";
import { apiError, apiOk } from "@/lib/server/api-response";
import { isolatedApplicationUrl } from "@/features/auth/origin";

export const runtime = "nodejs";

async function handleGET(
  _: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const preview = getPreview(id);
  return apiOk(preview && "url" in preview ? { ...preview, url: isolatedApplicationUrl(preview.url) } : preview);
}

async function handlePOST(
  _: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const project = getProject(id);
  if (!project) return apiError("项目不存在", 404);
  if (hasActiveRunForProject(id)) return apiError("Pi 正在修改项目，完成后再预览", 409);
  try {
    const preview = await startPreview(id, project.workspacePath, project.template.runtimeId);
    return apiOk({ ...preview, url: isolatedApplicationUrl(preview.url) });
  } catch (error) {
    if (error instanceof PreviewStartError) {
      return apiError(error.message, 502, { logs: error.logs });
    }
    throw error;
  }
}

async function handleDELETE(
  _: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return await stopPreview(id)
    ? apiOk({ status: "stopped" })
    : apiError("Preview 未运行", 404);
}

export const GET = withApiAuth(handleGET);
export const POST = withApiAuth(handlePOST);
export const DELETE = withApiAuth(handleDELETE);
