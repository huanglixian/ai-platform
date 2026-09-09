import {
  getPublicationJob,
  listPublicationEvents,
} from "@/app_factory/server/publication/repository";
import { apiError } from "@/lib/server/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function eventCursor(request: Request) {
  const queryValue = new URL(request.url).searchParams.get("after");
  const raw = queryValue ?? request.headers.get("last-event-id") ?? "0";
  const value = Number(raw);
  return Number.isInteger(value) && value >= 0 ? value : null;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await context.params;
  if (!getPublicationJob(jobId)) return apiError("发布任务不存在", 404);
  const initialCursor = eventCursor(request);
  if (initialCursor === null) return apiError("after 必须是非负整数", 422);

  const encoder = new TextEncoder();
  let cursor = initialCursor;
  let timer: NodeJS.Timeout | undefined;
  let keepAlive: NodeJS.Timeout | undefined;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let polling = false;
      const send = (value: string) => controller.enqueue(encoder.encode(value));
      const poll = () => {
        if (polling) return;
        polling = true;
        try {
          for (const event of listPublicationEvents(jobId, cursor)) {
            cursor = event.sequence;
            send(`id: ${event.sequence}\nevent: publication\ndata: ${JSON.stringify(event)}\n\n`);
          }
        } catch {
          cleanup();
          controller.close();
        } finally {
          polling = false;
        }
      };
      const cleanup = () => {
        if (timer) clearInterval(timer);
        if (keepAlive) clearInterval(keepAlive);
      };
      send(`retry: 1000\n\n`);
      poll();
      timer = setInterval(poll, 800);
      keepAlive = setInterval(() => send(`: keep-alive\n\n`), 15_000);
    },
    cancel() {
      if (timer) clearInterval(timer);
      if (keepAlive) clearInterval(keepAlive);
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
