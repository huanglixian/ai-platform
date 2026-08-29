import { executePiRun } from "@/app_factory/server/pi-run";
import { runService, sessionService } from "@/app_factory/server/services";
import { formatSseEvent } from "@/app_factory/server/sse";
import { apiError } from "@/lib/server/api-response";

export const runtime = "nodejs";

const encoder = new TextEncoder();

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

  let disconnected = false;
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (payload: string) => {
        if (disconnected) return;
        try {
          controller.enqueue(encoder.encode(payload));
        } catch {
          disconnected = true;
        }
      };

      send(
        formatSseEvent({
          event: "run.started",
          data: { runId: run.id, status: "running" },
        }),
      );

      try {
        let failed = false;
        for await (const event of executePiRun({
          runId: run.id,
          session,
          prompt,
        })) {
          if (event.type === "error") failed = true;
          send(
            formatSseEvent({
              id: `${event.runId}:${event.sequence}`,
              event: "harness",
              data: event,
            }),
          );
        }
        send(
          formatSseEvent({
            event: "run.finished",
            data: { runId: run.id, status: failed ? "failed" : "completed" },
          }),
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "Pi 执行失败";
        send(
          formatSseEvent({
            event: "run.error",
            data: { runId: run.id, message },
          }),
        );
      } finally {
        if (!disconnected) {
          try {
            controller.close();
          } catch {
            disconnected = true;
          }
        }
      }
    },
    cancel() {
      // 客户端断开时继续执行并落 transcript，避免一次网络波动丢失任务结果。
      disconnected = true;
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
