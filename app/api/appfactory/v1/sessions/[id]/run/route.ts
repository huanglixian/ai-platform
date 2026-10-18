import { withApiAuth } from "@/features/auth/api";
import { hasActivePublicationForProject } from "@/app_factory/server/publication/repository";
import {
  type AppFactoryRun,
  createRun,
  getActiveRunForSession,
  getSession,
  setSessionStatus,
} from "@/app_factory/server/database";
import { cancelPiRun, startPiRun } from "@/app_factory/server/pi-run";
import { apiError, apiOk } from "@/lib/server/api-response";
import { SessionBusyError } from "@/app_factory/server/errors";

export const runtime = "nodejs";

async function handleGET(
  _: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!getSession(id)) return apiError("会话不存在", 404);
  return apiOk(getActiveRunForSession(id));
}

async function handlePOST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const session = getSession(id);
  if (!session) return apiError("会话不存在", 404);

  const { prompt } = (await request.json()) as { prompt?: string };
  if (!prompt?.trim()) return apiError("请输入需求", 422);
  if (hasActivePublicationForProject(session.project_id)) {
    return apiError("项目正在发布，发布完成后再继续修改", 409);
  }

  let run: AppFactoryRun;
  try {
    run = createRun(session.project_id, id, prompt);
  } catch (error) {
    if (error instanceof SessionBusyError) return apiError(error.message, 409);
    throw error;
  }
  setSessionStatus(id, "running");
  startPiRun({ runId: run.id, session, prompt });
  return apiOk(run, { status: 201 });
}

async function handleDELETE(
  _: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!getSession(id)) return apiError("会话不存在", 404);
  const run = getActiveRunForSession(id);
  if (!run) return apiError("当前没有可停止的任务", 409);
  if (!(await cancelPiRun(run.id))) {
    return apiError("任务不在当前平台进程中，无法停止", 409);
  }
  return apiOk({ id: run.id, cancellationRequested: true });
}

export const GET = withApiAuth(handleGET);
export const POST = withApiAuth(handlePOST);
export const DELETE = withApiAuth(handleDELETE);
