import { apiError, apiOk } from "@/lib/server/api-response";
import { archiveApplication, applicationInputSchema, getApplication, updateApplication } from "@/features/apps/server";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const app = getApplication(id);
  return app ? apiOk(app) : apiError("应用不存在", 404);
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return archiveApplication(id) ? apiOk({ id, archived: true }) : apiError("应用不存在", 404);
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const parsed = applicationInputSchema.partial().safeParse(await request.json());
  if (!parsed.success) return apiError("应用字段校验失败", 422, parsed.error.flatten());
  const app = updateApplication(id, parsed.data);
  return app ? apiOk(app) : apiError("应用不存在", 404);
}
