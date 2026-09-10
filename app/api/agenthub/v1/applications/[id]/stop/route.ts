import { apiError, apiOk } from "@/lib/server/api-response";
import { getApplication, stopExternalApplication } from "@/features/apps/server";

export const runtime = "nodejs";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const app = getApplication(id);
  if (!app) return apiError("应用不存在", 404);
  if (app.source !== "external") return apiError("只有外部应用可以停止", 403);
  try {
    const stopped = await stopExternalApplication(id);
    return stopped ? apiOk(stopped) : apiError("应用不存在", 404);
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "停止服务失败", 409);
  }
}
