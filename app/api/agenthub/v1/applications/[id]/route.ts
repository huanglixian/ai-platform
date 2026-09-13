import { apiError, apiOk } from "@/lib/server/api-response";
import {
  appFactoryApplicationUpdateSchema,
  applicationUpdateSchema,
  externalApplicationUpdateSchema,
  getApplication,
  removeApplication,
  updateApplication,
} from "@/features/apps/server";

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
  try {
    return await removeApplication(id) ? apiOk({ id, removed: true }) : apiError("应用不存在", 404);
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "移除应用失败", 409);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const app = getApplication(id);
  if (!app) return apiError("应用不存在", 404);
  const schema = app.source === "external"
    ? externalApplicationUpdateSchema
    : app.source === "appfactory"
      ? appFactoryApplicationUpdateSchema
      : applicationUpdateSchema;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return apiError("应用字段校验失败", 422, parsed.error.flatten());
  const updated = updateApplication(id, parsed.data);
  return updated ? apiOk(updated) : apiError("应用不存在", 404);
}
