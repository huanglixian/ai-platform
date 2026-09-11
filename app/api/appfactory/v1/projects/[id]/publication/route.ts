import { getProject, hasActiveRunForProject } from "@/app_factory/server/database";
import {
  enqueuePublication,
  hasActivePublicationForProject,
  getLatestPublicationDeployment,
  getLatestPublicationRelease,
  listPublicationJobs,
} from "@/app_factory/server/publication/repository";
import { apiError, apiOk } from "@/lib/server/api-response";

export const runtime = "nodejs";

export async function GET(
  _: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!getProject(id)) return apiError("项目不存在", 404);
  return apiOk({
    job: listPublicationJobs(id)[0] ?? null,
    release: getLatestPublicationRelease(id),
    deployment: getLatestPublicationDeployment(id),
  });
}

export async function POST(
  _: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!getProject(id)) return apiError("项目不存在", 404);
  if (hasActiveRunForProject(id)) return apiError("Pi 正在修改项目，任务完成后再发布", 409);
  if (hasActivePublicationForProject(id)) return apiError("项目正在发布", 409);
  return apiOk(enqueuePublication(id), { status: 201 });
}
