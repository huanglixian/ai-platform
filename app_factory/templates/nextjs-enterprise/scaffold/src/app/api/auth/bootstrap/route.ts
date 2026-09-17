import { assertBootstrapToken, bootstrapInitialAdministrator } from "@/server/auth/service";
import { errorResponse } from "@/server/errors/response";
import { requestIdFor } from "@/server/observability/logger";
import { optionalStringField, readJson, record, stringField } from "@/server/validation/input";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = requestIdFor(request);
  try {
    assertBootstrapToken(request);
    const body = record(await readJson(request));
    const user = await bootstrapInitialAdministrator({
      username: stringField(body.username, "username", { min: 3, max: 80 }),
      password: stringField(body.password, "password", { min: 12, max: 256 }),
      displayName: optionalStringField(body.displayName, "displayName", { max: 120 }),
    });
    return Response.json({ data: user, requestId }, { status: 201 });
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
