import { z } from "zod";
import { withApiAuth } from "@/features/auth/api";
import { requireRequestUser } from "@/features/auth/context";
import { passwordSchema, resetPassword } from "@/features/auth/users";
import { apiError, apiOk } from "@/lib/server/api-response";

export const POST = withApiAuth(async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const input = z
    .object({ password: passwordSchema })
    .safeParse(await request.json());
  if (!input.success) return apiError("密码至少 8 位，最多 128 位", 422);
  const { id } = await params;
  await resetPassword(id, input.data.password, requireRequestUser().id);
  return apiOk({ id });
});
