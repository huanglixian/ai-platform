import { getPublicationJob } from "@/app_factory/server/publication/repository";
import { apiError, apiOk } from "@/lib/server/api-response";

export const runtime = "nodejs";

export async function GET(
  _: Request,
  context: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await context.params;
  const job = getPublicationJob(jobId);
  if (!job) return apiError("发布任务不存在", 404);
  return apiOk(job);
}
