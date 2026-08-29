import { piHarnessRuntime } from "@/app_factory/features/pi-harness";
import { runService, sessionService } from "@/app_factory/server/services";
import { appendTranscript } from "@/app_factory/server/transcript";
import { apiError, apiOk } from "@/lib/server/api-response";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const session = sessionService.get(id);
  if (!session) return apiError("会话不存在", 404);

  const { prompt } = (await request.json()) as { prompt?: string };
  if (!prompt?.trim()) return apiError("请输入需求", 422);

  const run = runService.create(session.project_id, id, prompt) as { id: string };
  sessionService.setStatus(id, "running");
  const events = [];

  try {
    const userEvent = {
      type: "user",
      content: prompt,
      timestamp: new Date().toISOString(),
    };
    events.push(userEvent);
    const initialTranscriptPath = await appendTranscript(id, userEvent);
    sessionService.setTranscriptPath(id, initialTranscriptPath);

    for await (const event of piHarnessRuntime.run(
      { id, projectId: session.project_id, harness: "pi", cwd: session.cwd },
      prompt,
    )) {
      events.push(event);
      const transcriptPath = await appendTranscript(id, event);
      sessionService.setTranscriptPath(id, transcriptPath);
    }

    const failure = events.find((event) => event.type === "error");
    if (failure) {
      runService.finish(run.id, "failed", failure.content);
      sessionService.setStatus(id, "error");
      return apiError(failure.content, 502, { runId: run.id, events });
    }

    runService.finish(run.id, "completed", JSON.stringify(events));
    sessionService.setStatus(id, "idle");
    return apiOk({ runId: run.id, events });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Pi 执行失败";
    const failedEvent = {
      type: "error",
      content: message,
      timestamp: new Date().toISOString(),
    };
    events.push(failedEvent);
    const transcriptPath = await appendTranscript(id, failedEvent);
    sessionService.setTranscriptPath(id, transcriptPath);
    runService.finish(run.id, "failed", message);
    sessionService.setStatus(id, "error");
    return apiError(message, 500);
  }
}

export async function DELETE(
  _: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const session = sessionService.get(id);
  if (!session) return apiError("会话不存在", 404);
  await piHarnessRuntime.cancel({
    id,
    projectId: session.project_id,
    harness: "pi",
    cwd: session.cwd,
  });
  runService.failActive(id);
  sessionService.setStatus(id, "error");
  return apiOk({ id, cancelled: true });
}
