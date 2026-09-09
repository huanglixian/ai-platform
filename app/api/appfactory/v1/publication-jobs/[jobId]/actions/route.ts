import {
  cancelPublicationJob,
  enqueuePublication,
  getPublicationJob,
} from "@/app_factory/server/publication/repository";
import { apiError, apiOk } from "@/lib/server/api-response";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await context.params;
  const job = getPublicationJob(jobId);
  if (!job) return apiError("发布任务不存在", 404);
  const body = await request.json().catch(() => null) as { action?: unknown } | null;
  if (body?.action !== "cancel" && body?.action !== "retry") {
    return apiError("action 仅支持 cancel 或 retry", 422);
  }
  if (body.action === "cancel") {
    if (job.status !== "queued" && job.status !== "running") {
      return apiError("当前发布任务不能取消", 409);
    }
    return apiOk(cancelPublicationJob(job.id));
  }
  if (job.status !== "failed" && job.status !== "cancelled") {
    return apiError("只有失败或已取消的发布任务可以重试", 409);
  }
  return apiOk(enqueuePublication(job.projectId), { status: 201 });
}
