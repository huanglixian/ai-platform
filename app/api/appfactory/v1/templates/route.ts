import { listAppTemplateSummaries } from "@/app_factory/template-catalog";
import { apiOk } from "@/lib/server/api-response";

export const runtime = "nodejs";

export function GET() {
  return apiOk(listAppTemplateSummaries());
}
