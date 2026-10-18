import { withApiAuth } from "@/features/auth/api";
import { requireRequestUser } from "@/features/auth/context";
import {
  deleteUser,
  updateUser,
  userUpdateSchema,
} from "@/features/auth/users";
import { apiError, apiOk } from "@/lib/server/api-response";

export const PATCH = withApiAuth(async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const input = userUpdateSchema.safeParse(await request.json());
  if (!input.success)
    return apiError(input.error.issues[0]?.message ?? "用户信息无效", 422);
  const { id } = await params;
  updateUser(id, input.data, requireRequestUser().id);
  return apiOk({ id });
});
export const DELETE = withApiAuth(async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  deleteUser(id, requireRequestUser().id);
  return apiOk({ id });
});
