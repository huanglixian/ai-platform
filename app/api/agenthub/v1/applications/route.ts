import { withApiAuth } from "@/features/auth/api";
import { apiError, apiOk } from "@/lib/server/api-response";
import { applicationInputSchema, createApplication, listApplications } from "@/features/apps/server";

export const runtime = "nodejs";

function handleGET() {
  return apiOk(listApplications());
}

async function handlePOST(request: Request) {
  const parsed = applicationInputSchema.safeParse(await request.json());
  if (!parsed.success) return apiError("应用字段校验失败", 422, parsed.error.flatten());
  if (parsed.data.producer === "appfactory") return apiError("AppFactory 应用须从项目发布", 422);
  return apiOk(createApplication(parsed.data), { status: 201 });
}

export const GET = withApiAuth(handleGET);
export const POST = withApiAuth(handlePOST);
