import { z } from "zod";
import { withApiAuth } from "@/features/auth/api";
import { requireRequestUser } from "@/features/auth/context";
import { verifyPassword } from "@/features/auth/password";
import {
  passwordSchema,
  resetPassword,
  userPasswordHash,
} from "@/features/auth/users";
import { apiError, apiOk } from "@/lib/server/api-response";

export const POST = withApiAuth(async function POST(request: Request) {
  const input = z
    .object({ currentPassword: z.string().max(128), password: passwordSchema })
    .safeParse(await request.json());
  if (!input.success) return apiError("密码格式无效，至少 8 位", 422);
  const user = requireRequestUser();
  if (
    !(await verifyPassword(
      input.data.currentPassword,
      userPasswordHash(user.id) ?? "",
    ))
  )
    return apiError("当前密码不正确", 422);
  await resetPassword(user.id, input.data.password, user.id);
  return apiOk({ changed: true });
});
