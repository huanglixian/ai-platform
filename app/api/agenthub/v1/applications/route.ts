import { apiError, apiOk } from "@/lib/server/api-response";
import { applicationInputSchema, createApplication, listApplications } from "@/features/apps/server";

export const runtime = "nodejs";

export function GET() {
  return apiOk(listApplications());
}

export async function POST(request: Request) {
  const parsed = applicationInputSchema.safeParse(await request.json());
  if (!parsed.success) return apiError("应用字段校验失败", 422, parsed.error.flatten());
  return apiOk(createApplication(parsed.data), { status: 201 });
}
