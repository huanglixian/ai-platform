import { piHarnessRuntime } from "@/app_factory/features/pi-harness";
import type { ModelProfileId } from "@/app_factory/server/model-profiles";
import {
  finishRun,
  getAppFactoryModelSettings,
  getRun,
  setSessionStatus,
  setSessionTitleFromPrompt,
  setSessionTranscriptPath,
  type AppFactoryRunStatus,
} from "@/app_factory/server/database";
import {
  appendTranscript,
  type TranscriptEvent,
} from "@/app_factory/server/transcript";
import { restartActivePreview } from "@/app_factory/server/preview";
import { getAppTemplate, type AppTemplateId } from "@/app_factory/template-catalog";

export type PiRunEvent = TranscriptEvent & {
  runId: string;
  sequence: number;
};

export type PiRunContext = {
  runId: string;
  session: {
    id: string;
    project_id: string;
    cwd: string;
    model_profile_id: ModelProfileId;
    template_id: AppTemplateId;
  };
  prompt: string;
};

export type PiRunUpdate =
  | { type: "event"; event: PiRunEvent }
  | {
      type: "finished";
      status: Exclude<AppFactoryRunStatus, "running">;
      message: string;
    };

type ActivePiRun = {
  session: PiRunContext["session"];
  cancellationRequested: boolean;
};

const activePiRuns = new Map<string, ActivePiRun>();
const subscribers = new Map<string, Set<(update: PiRunUpdate) => void>>();

function publish(runId: string, update: PiRunUpdate) {
  const listeners = subscribers.get(runId);
  if (!listeners) return;
  for (const listener of listeners) {
    try {
      listener(update);
    } catch {
      listeners.delete(listener);
    }
  }
  if (!listeners.size) subscribers.delete(runId);
}

export function subscribeToPiRun(runId: string, listener: (update: PiRunUpdate) => void) {
  const listeners = subscribers.get(runId) ?? new Set();
  listeners.add(listener);
  subscribers.set(runId, listeners);
  return () => {
    listeners.delete(listener);
    if (!listeners.size) subscribers.delete(runId);
  };
}

async function consumePiRun(context: PiRunContext, activeRun: ActivePiRun) {
  try {
    for await (const event of executePiRun({
      ...context,
      cancellationRequested: () => activeRun.cancellationRequested,
    })) {
      publish(context.runId, { type: "event", event });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Pi 执行失败";
    const current = getRun(context.runId);
    if (current?.status === "running") {
      const status = activeRun.cancellationRequested ? "cancelled" : "failed";
      finishRun(context.runId, status, status === "cancelled" ? "任务已取消" : message);
      setSessionStatus(context.session.id, status === "cancelled" ? "idle" : "error");
    }
  } finally {
    const run = getRun(context.runId);
    const status = run?.status === "completed" || run?.status === "cancelled"
      ? run.status
      : "failed";
    publish(context.runId, {
      type: "finished",
      status,
      message: run?.output || (status === "cancelled" ? "任务已取消" : "Pi 执行失败"),
    });
    activePiRuns.delete(context.runId);
  }
}

export function startPiRun(context: PiRunContext) {
  if (activePiRuns.has(context.runId)) return;
  const activeRun: ActivePiRun = {
    session: context.session,
    cancellationRequested: false,
  };
  activePiRuns.set(context.runId, activeRun);
  void consumePiRun(context, activeRun);
}

export async function cancelPiRun(runId: string) {
  const activeRun = activePiRuns.get(runId);
  if (!activeRun) return false;
  activeRun.cancellationRequested = true;
  await piHarnessRuntime.cancel({
    id: activeRun.session.id,
    projectId: activeRun.session.project_id,
    harness: "pi",
    cwd: activeRun.session.cwd,
  });
  return true;
}

export async function* executePiRun({
  runId,
  session,
  prompt,
  cancellationRequested = () => false,
}: PiRunContext & { cancellationRequested?: () => boolean }): AsyncGenerator<PiRunEvent> {
  const template = getAppTemplate(session.template_id);
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

    if (cancellationRequested()) {
      yield await persist({
        type: "completed",
        content: "任务已取消",
        timestamp: new Date().toISOString(),
      });
      finishRun(runId, "cancelled", "任务已取消");
      setSessionStatus(session.id, "idle");
      return;
    }

    const thinkingLevel = getAppFactoryModelSettings().thinkingLevels[session.model_profile_id];
    let failure = "";
    for await (const event of piHarnessRuntime.run(
      { id: session.id, projectId: session.project_id, harness: "pi", cwd: session.cwd },
      prompt,
      {
        modelProfileId: session.model_profile_id,
        thinkingLevel,
        templateId: template.id,
      },
    )) {
      const persisted = await persist(event);
      yield persisted;
      if (event.type === "error") failure = event.content;
    }

    if (cancellationRequested()) {
      finishRun(runId, "cancelled", "任务已取消");
      setSessionStatus(session.id, "idle");
      return;
    }
    if (failure) {
      finishRun(runId, "failed", failure);
      setSessionStatus(session.id, "error");
      return;
    }

    finishRun(runId, "completed", JSON.stringify(events));
    setSessionStatus(session.id, "idle");
  } catch (error) {
    const cancelled = cancellationRequested();
    const message = cancelled
      ? "任务已取消"
      : error instanceof Error
        ? error.message
        : "Pi 执行失败";
    const terminalEvent = await persist({
      type: cancelled ? "completed" : "error",
      content: message,
      timestamp: new Date().toISOString(),
    });
    yield terminalEvent;
    finishRun(runId, cancelled ? "cancelled" : "failed", message);
    setSessionStatus(session.id, cancelled ? "idle" : "error");
  } finally {
    await restartActivePreview(session.project_id, session.cwd, template.runtimeId);
  }
}
