import { apiOk } from "@/lib/server/api-response";
import { listCapabilities } from "@/features/capabilities/server";
export const runtime = "nodejs";
export function GET(request:Request){ return apiOk(listCapabilities(new URL(request.url).searchParams.get("kind") as "skill"|"tool"|"service"|null ?? undefined)); }
