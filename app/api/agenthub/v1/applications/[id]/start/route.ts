import { apiError, apiOk } from "@/lib/server/api-response";
import { getApplication, startExternalApplication } from "@/features/apps/server";

export const runtime = "nodejs";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const app = getApplication(id);
  if (!app) return apiError("应用不存在", 404);
  if (app.source !== "external") return apiError("只有外部应用可以启动", 403);
  try {
    const started = await startExternalApplication(id);
    return started ? apiOk(started) : apiError("应用不存在", 404);
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "启动服务失败", 409);
  }
}
