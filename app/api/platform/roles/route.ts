import { withApiAuth } from "@/features/auth/api";
import { listRoles } from "@/features/auth/users";
import { apiOk } from "@/lib/server/api-response";

export const GET = withApiAuth(function GET() {
  return apiOk(listRoles());
});
