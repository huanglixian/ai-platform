import { piHarnessRuntime } from "@/app_factory/features/pi-harness";
import { runService, sessionService } from "@/app_factory/server/services";
import {
  appendTranscript,
  type TranscriptEvent,
} from "@/app_factory/server/transcript";

export type PiRunEvent = TranscriptEvent & {
  runId: string;
  sequence: number;
};

type PiRunContext = {
  runId: string;
  session: {
    id: string;
    project_id: string;
    cwd: string;
  };
  prompt: string;
};

/**
 * Pi 执行的唯一服务端实现。JSON 和 SSE 接口都消费这个生成器，确保
 * transcript、运行状态与实时事件使用同一条事实链路。
 */
export async function* executePiRun({
  runId,
  session,
  prompt,
}: PiRunContext): AsyncGenerator<PiRunEvent> {
  let sequence = 0;
  const events: PiRunEvent[] = [];

  const persist = async (event: TranscriptEvent) => {
    const next: PiRunEvent = {
      ...event,
      runId,
      sequence: sequence++,
      timestamp: event.timestamp || new Date().toISOString(),
    };
    events.push(next);
    const transcriptPath = await appendTranscript(session.id, next);
    sessionService.setTranscriptPath(session.id, transcriptPath);
    return next;
  };

  try {
    yield await persist({
      type: "user",
      content: prompt,
      timestamp: new Date().toISOString(),
    });

    let failure = "";
    for await (const event of piHarnessRuntime.run(
      { id: session.id, projectId: session.project_id, harness: "pi", cwd: session.cwd },
      prompt,
    )) {
      const persisted = await persist(event);
      yield persisted;
      if (event.type === "error") failure = event.content;
    }

    if (failure) {
      runService.finish(runId, "failed", failure);
      sessionService.setStatus(session.id, "error");
      return;
    }

    runService.finish(runId, "completed", JSON.stringify(events));
    sessionService.setStatus(session.id, "idle");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Pi 执行失败";
    const failedEvent = await persist({
      type: "error",
      content: message,
      timestamp: new Date().toISOString(),
    });
    yield failedEvent;
    runService.finish(runId, "failed", message);
    sessionService.setStatus(session.id, "error");
  }
}
