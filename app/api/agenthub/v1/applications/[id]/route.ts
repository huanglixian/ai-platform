import { withApiAuth } from "@/features/auth/api";
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

async function handleGET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const app = getApplication(id);
  return app ? apiOk(app) : apiError("应用不存在", 404);
}

async function handleDELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const app = getApplication(id);
  if (!app) return apiError("应用不存在", 404);
  try {
    return await removeApplication(id) ? apiOk({ id, removed: true }) : apiError("应用不存在", 404);
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "移除应用失败", 409);
  }
}

async function handlePATCH(request: Request, context: { params: Promise<{ id: string }> }) {
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
  if (parsed.data.visibility !== undefined && parsed.data.policyRevision === undefined) return apiError("修改访问范围需提供当前版本", 422);
  const updated = updateApplication(id, parsed.data);
  return updated ? apiOk(updated) : apiError("应用不存在", 404);
}

export const GET = withApiAuth(handleGET);
export const DELETE = withApiAuth(handleDELETE);
export const PATCH = withApiAuth(handlePATCH);
