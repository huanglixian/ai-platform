import { withApiAuth } from "@/features/auth/api";
import { apiOk } from "@/lib/server/api-response";
import { listCapabilities } from "@/features/capabilities/server";
export const runtime = "nodejs";
function handleGET(request:Request){ return apiOk(listCapabilities(new URL(request.url).searchParams.get("kind") as "skill"|"tool"|"service"|null ?? undefined)); }

export const GET = withApiAuth(handleGET);
