import { piHarnessRuntime } from "@/app_factory/features/pi-harness";
import {
  createRun,
  failActiveRun,
  finishRun,
  getSession,
  setSessionStatus,
} from "@/app_factory/server/database";
import { executePiRun } from "@/app_factory/server/pi-run";
import { apiError, apiOk } from "@/lib/server/api-response";
import { SessionBusyError } from "@/app_factory/server/errors";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const session = getSession(id);
  if (!session) return apiError("会话不存在", 404);

  const { prompt } = (await request.json()) as { prompt?: string };
  if (!prompt?.trim()) return apiError("请输入需求", 422);

  let run: { id: string };
  try {
    run = createRun(session.project_id, id, prompt) as { id: string };
  } catch (error) {
    if (error instanceof SessionBusyError) return apiError(error.message, 409);
    throw error;
  }
  setSessionStatus(id, "running");
  const events = [];

  try {
    for await (const event of executePiRun({
      runId: run.id,
      session,
      prompt,
    })) {
      events.push(event);
    }

    const failure = events.find((event) => event.type === "error");
    if (failure) {
      return apiError(failure.content, 502, { runId: run.id, events });
    }

    return apiOk({ runId: run.id, events });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Pi 执行失败";
    finishRun(run.id, "failed", message);
    setSessionStatus(id, "error");
    return apiError(message, 500);
  }
}

export async function DELETE(
  _: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const session = getSession(id);
  if (!session) return apiError("会话不存在", 404);
  await piHarnessRuntime.cancel({
    id,
    projectId: session.project_id,
    harness: "pi",
    cwd: session.cwd,
  });
  failActiveRun(id);
  setSessionStatus(id, "error");
  return apiOk({ id, cancelled: true });
}
