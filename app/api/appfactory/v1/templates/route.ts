import { withApiAuth } from "@/features/auth/api";
import { listAppTemplateSummaries } from "@/app_factory/template-catalog";
import { apiOk } from "@/lib/server/api-response";

export const runtime = "nodejs";

function handleGET() {
  return apiOk(listAppTemplateSummaries());
}

export const GET = withApiAuth(handleGET);
