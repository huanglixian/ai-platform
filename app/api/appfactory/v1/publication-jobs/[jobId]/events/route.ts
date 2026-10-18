import { withApiAuth } from "@/features/auth/api";
import {
  getPublicationJob,
  listPublicationEvents,
} from "@/app_factory/server/publication/repository";
import { apiError, apiOk } from "@/lib/server/api-response";

export const runtime = "nodejs";

function parseAfter(value: string | null) {
  const parsed = Number(value ?? "0");
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

async function handleGET(
  request: Request,
  context: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await context.params;
  if (!getPublicationJob(jobId)) return apiError("发布任务不存在", 404);
  const after = parseAfter(new URL(request.url).searchParams.get("after"));
  if (after === null) return apiError("after 必须是非负整数", 422);
  return apiOk(listPublicationEvents(jobId, after));
}

export const GET = withApiAuth(handleGET);
