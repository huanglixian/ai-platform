import { getProject } from "@/app_factory/server/database";
import {
  enqueuePublication,
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
  return apiOk(enqueuePublication(id), { status: 201 });
}
