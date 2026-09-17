import { clearSessionCookie, logout } from "@/server/auth/session";
import { errorResponse } from "@/server/errors/response";
import { requestIdFor } from "@/server/observability/logger";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = requestIdFor(request);
  try {
    await logout(request);
    return Response.json({ data: { loggedOut: true }, requestId }, { headers: { "set-cookie": clearSessionCookie() } });
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
