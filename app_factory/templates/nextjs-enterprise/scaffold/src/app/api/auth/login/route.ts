import { authenticate } from "@/server/auth/service";
import { errorResponse } from "@/server/errors/response";
import { requestIdFor } from "@/server/observability/logger";
import { readJson, record, stringField } from "@/server/validation/input";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = requestIdFor(request);
  try {
    const body = record(await readJson(request));
    const result = await authenticate(
      stringField(body.username, "username", { min: 3, max: 80 }),
      stringField(body.password, "password", { min: 12, max: 256 }),
    );
    return Response.json({ data: result.principal, requestId }, { headers: { "set-cookie": result.cookie } });
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
