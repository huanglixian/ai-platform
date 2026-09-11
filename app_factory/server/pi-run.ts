import { piHarnessRuntime } from "@/app_factory/features/pi-harness";
import type { ModelProfileId } from "@/app_factory/server/model-profiles";
import {
  finishRun,
  getAppFactoryModelSettings,
  setSessionStatus,
  setSessionTitleFromPrompt,
  setSessionTranscriptPath,
} from "@/app_factory/server/database";
import {
  appendTranscript,
  type TranscriptEvent,
} from "@/app_factory/server/transcript";
import { invalidatePreview } from "@/app_factory/server/preview";

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
    model_profile_id: ModelProfileId;
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
    setSessionTranscriptPath(session.id, transcriptPath);
    return next;
  };

  try {
    setSessionTitleFromPrompt(session.id, prompt);
    yield await persist({
      type: "user",
      content: prompt,
      timestamp: new Date().toISOString(),
    });

    const { thinkingLevel } = getAppFactoryModelSettings();
    let failure = "";
    for await (const event of piHarnessRuntime.run(
      { id: session.id, projectId: session.project_id, harness: "pi", cwd: session.cwd },
      prompt,
      { modelProfileId: session.model_profile_id, thinkingLevel },
    )) {
      const persisted = await persist(event);
      yield persisted;
      if (event.type === "error") failure = event.content;
    }

    if (failure) {
      finishRun(runId, "failed", failure);
      setSessionStatus(session.id, "error");
      return;
    }

    finishRun(runId, "completed", JSON.stringify(events));
    setSessionStatus(session.id, "idle");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Pi 执行失败";
    const failedEvent = await persist({
      type: "error",
      content: message,
      timestamp: new Date().toISOString(),
    });
    yield failedEvent;
    finishRun(runId, "failed", message);
    setSessionStatus(session.id, "error");
  } finally {
    await invalidatePreview(session.project_id);
  }
}
