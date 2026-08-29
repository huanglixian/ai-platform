import { sessionService } from "@/app_factory/server/services";
import { readTranscript } from "@/app_factory/server/transcript";
import { apiError, apiOk } from "@/lib/server/api-response";

export const runtime = "nodejs";

export async function GET(
  _: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const session = sessionService.get(id) as
    | { transcript_path?: string | null }
    | undefined;
  if (!session) return apiError("会话不存在", 404);
  try {
    return apiOk(await readTranscript(session.transcript_path));
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "会话记录读取失败",
      500,
    );
  }
}
