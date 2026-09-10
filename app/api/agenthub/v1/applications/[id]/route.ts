import { apiError, apiOk } from "@/lib/server/api-response";
import { archiveExternalApplication, externalApplicationUpdateSchema, getApplication, updateExternalApplication } from "@/features/apps/server";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const app = getApplication(id);
  return app ? apiOk(app) : apiError("应用不存在", 404);
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const app = getApplication(id);
  if (!app) return apiError("应用不存在", 404);
  if (app.source !== "external") return apiError("只有外部应用可以移除", 403);
  return await archiveExternalApplication(id) ? apiOk({ id, archived: true }) : apiError("应用不存在", 404);
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const app = getApplication(id);
  if (!app) return apiError("应用不存在", 404);
  if (app.source !== "external") return apiError("只有外部应用可以编辑", 403);
  const parsed = externalApplicationUpdateSchema.safeParse(await request.json());
  if (!parsed.success) return apiError("应用字段校验失败", 422, parsed.error.flatten());
  const updated = updateExternalApplication(id, parsed.data);
  return updated ? apiOk(updated) : apiError("应用不存在", 404);
}
