import { apiError, apiOk } from "@/lib/server/api-response";
import { listApplications, stopManagedExternalApplications } from "@/features/apps/server";
import type { ExternalStopResponse } from "@/features/apps/types";

export const runtime = "nodejs";

export async function POST() {
  try {
    const result = await stopManagedExternalApplications();
    return apiOk<ExternalStopResponse>({ ...result, applications: listApplications() });
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "批量停止服务失败", 500);
  }
}
