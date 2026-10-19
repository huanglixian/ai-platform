import { withApiAuth } from "@/features/auth/api";
import { apiError, apiOk } from "@/lib/server/api-response";
import { deploymentInputSchema, importSourceApplication, MAX_ARCHIVE_SIZE } from "@/features/apps/deployment/server";

export const runtime = "nodejs";

async function handlePOST(request: Request) {
  if (Number(request.headers.get("content-length")) > MAX_ARCHIVE_SIZE + 64_000) return apiError("源码包不能超过 100 MB", 413);
  const form = await request.formData();
  const parsed = deploymentInputSchema.safeParse(Object.fromEntries(["name", "description", "visibility", "instructions", "environment"].map((key) => [key, form.get(key) ?? undefined])));
  if (!parsed.success) return apiError("接入信息校验失败", 422, parsed.error.flatten());
  const archive = form.get("archive");
  if (!(archive instanceof File)) return apiError("请选择 ZIP 源码包", 422);
  try {
    return apiOk(await importSourceApplication(parsed.data, archive), { status: 201 });
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "源码导入失败", 422);
  }
}

export const POST = withApiAuth(handlePOST);
