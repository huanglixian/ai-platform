import { withApiAuth } from "@/features/auth/api";
import { requireRequestUser } from "@/features/auth/context";
import { apiOk } from "@/lib/server/api-response";

export const GET = withApiAuth(function GET() {
  return apiOk(requireRequestUser());
});
