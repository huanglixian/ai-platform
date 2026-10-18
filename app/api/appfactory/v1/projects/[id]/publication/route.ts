import { withApiAuth } from "@/features/auth/api";
import { getProject, hasActiveRunForProject } from "@/app_factory/server/database";
import {
  enqueuePublication,
  hasActivePublicationForProject,
  getLatestPublicationDeployment,
  getLatestPublicationRelease,
  listPublicationJobs,
} from "@/app_factory/server/publication/repository";
import { apiError, apiOk } from "@/lib/server/api-response";
import { z } from "zod";
import { publishedApplicationAccess } from "@/features/apps/server";

export const runtime = "nodejs";

async function handleGET(
  _: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!getProject(id)) return apiError("项目不存在", 404);
  return apiOk({
    access: publishedApplicationAccess(id) ?? null,
    job: listPublicationJobs(id)[0] ?? null,
    release: getLatestPublicationRelease(id),
    deployment: getLatestPublicationDeployment(id),
  });
}

async function handlePOST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!getProject(id)) return apiError("项目不存在", 404);
  if (hasActiveRunForProject(id)) return apiError("Pi 正在修改项目，任务完成后再发布", 409);
  if (hasActivePublicationForProject(id)) return apiError("项目正在发布", 409);
  const input = z.object({ visibility: z.enum(["private", "internal", "all"]), policyRevision: z.number().int().nonnegative() }).strict().safeParse(await request.json());
  if (!input.success) return apiError("请选择有效的发布范围", 422);
  return apiOk(enqueuePublication(id, input.data.visibility, input.data.policyRevision), { status: 201 });
}

export const GET = withApiAuth(handleGET);
export const POST = withApiAuth(handlePOST);
