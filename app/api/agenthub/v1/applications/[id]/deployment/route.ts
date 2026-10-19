import { z } from "zod";
import { withApiAuth } from "@/features/auth/api";
import { apiError, apiOk } from "@/lib/server/api-response";
import { getDeploymentDetail, updateDeployment } from "@/features/apps/deployment/server";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

async function handleGET(_request: Request, context: Context) {
  const detail = await getDeploymentDetail((await context.params).id);
  return detail ? apiOk(detail) : apiError("部署记录不存在", 404);
}

async function handlePOST(request: Request, context: Context) {
  const parsed = z.object({
    action: z.enum(["retry", "cancel"]), environment: z.string().max(32_000).optional(), instructions: z.string().max(10_000).optional(),
  }).strict().safeParse(await request.json());
  if (!parsed.success) return apiError("部署操作参数无效", 422);
  try {
    return apiOk(await updateDeployment((await context.params).id, parsed.data));
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "部署操作失败", 409);
  }
}

export const GET = withApiAuth(handleGET);
export const POST = withApiAuth(handlePOST);
