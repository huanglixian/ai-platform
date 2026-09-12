import { getRun, getSession, type AppFactoryRunStatus } from "@/app_factory/server/database";
import {
  subscribeToPiRun,
  type PiRunEvent,
  type PiRunUpdate,
} from "@/app_factory/server/pi-run";
import { formatSseEvent } from "@/app_factory/server/sse";
import { readTranscript } from "@/app_factory/server/transcript";
import { apiError } from "@/lib/server/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function eventCursor(request: Request) {
  const queryValue = new URL(request.url).searchParams.get("after");
  const raw = request.headers.get("last-event-id") ?? queryValue ?? "-1";
  const value = Number(raw);
  return Number.isInteger(value) && value >= -1 ? value : null;
}

function terminalStatus(status: AppFactoryRunStatus): Exclude<AppFactoryRunStatus, "running"> {
  return status === "completed" || status === "cancelled" ? status : "failed";
}

function isRunEvent(value: unknown, runId: string): value is PiRunEvent {
  return Boolean(
    value &&
      typeof value === "object" &&
      "runId" in value &&
      "sequence" in value &&
      (value as PiRunEvent).runId === runId &&
      Number.isInteger((value as PiRunEvent).sequence),
  );
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const run = getRun(id);
  if (!run) return apiError("任务不存在", 404);
  const session = getSession(run.sessionId);
  if (!session) return apiError("会话不存在", 404);
  const initialCursor = eventCursor(request);
  if (initialCursor === null) return apiError("after 必须是大于等于 -1 的整数", 422);

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | undefined;
  let heartbeat: NodeJS.Timeout | undefined;
  let closed = false;
  let cursor = initialCursor;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const pending: PiRunUpdate[] = [];
      let ready = false;
      const cleanup = () => {
        unsubscribe?.();
        if (heartbeat) clearInterval(heartbeat);
      };
      const close = () => {
        if (closed) return;
        closed = true;
        cleanup();
        controller.close();
      };
      const send = (value: string) => {
        if (!closed) controller.enqueue(encoder.encode(value));
      };
      const dispatch = (update: PiRunUpdate) => {
        if (closed) return;
        if (update.type === "event") {
          if (update.event.sequence <= cursor) return;
          cursor = update.event.sequence;
          send(formatSseEvent({
            id: String(update.event.sequence),
            event: "harness",
            data: update.event,
          }));
          return;
        }
        send(formatSseEvent({
          event: "run.finished",
          data: { runId: id, status: update.status, message: update.message },
        }));
        close();
      };

      unsubscribe = subscribeToPiRun(id, (update) => {
        if (ready) dispatch(update);
        else pending.push(update);
      });

      try {
        const transcript = await readTranscript(session.transcript_path);
        transcript
          .filter((event) => isRunEvent(event, id))
          .sort((left, right) => left.sequence - right.sequence)
          .forEach((event) => dispatch({ type: "event", event }));
        ready = true;
        pending.splice(0).forEach(dispatch);

        const current = getRun(id);
        if (!current || current.status !== "running") {
          dispatch({
            type: "finished",
            status: terminalStatus(current?.status ?? "failed"),
            message: current?.output || "任务已结束",
          });
          return;
        }
        if (!closed) heartbeat = setInterval(() => send(": keep-alive\n\n"), 15_000);
      } catch (error) {
        cleanup();
        closed = true;
        controller.error(error);
      }
    },
    cancel() {
      closed = true;
      unsubscribe?.();
      if (heartbeat) clearInterval(heartbeat);
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream; charset=utf-8",
      "X-Accel-Buffering": "no",
    },
  });
}
