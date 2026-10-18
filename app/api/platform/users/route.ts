import { withApiAuth } from "@/features/auth/api";
import { requireRequestUser } from "@/features/auth/context";
import { createUser, listUsers, userInputSchema } from "@/features/auth/users";
import { apiError, apiOk } from "@/lib/server/api-response";

export const GET = withApiAuth(function GET() {
  return apiOk(listUsers());
});
export const POST = withApiAuth(async function POST(request: Request) {
  const input = userInputSchema.safeParse(await request.json());
  if (!input.success)
    return apiError(input.error.issues[0]?.message ?? "用户信息无效", 422);
  return apiOk(await createUser(input.data, requireRequestUser().id), {
    status: 201,
  });
});
