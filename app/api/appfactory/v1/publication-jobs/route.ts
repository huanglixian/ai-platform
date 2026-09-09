import { listPublicationJobs } from "@/app_factory/server/publication/repository";
import { apiOk } from "@/lib/server/api-response";

export const runtime = "nodejs";

export function GET(request: Request) {
  const projectId = new URL(request.url).searchParams.get("projectId")?.trim();
  return apiOk(listPublicationJobs(projectId || undefined));
}
