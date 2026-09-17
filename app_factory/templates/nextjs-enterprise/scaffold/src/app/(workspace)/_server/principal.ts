import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { currentPrincipalFromCookie } from "@/server/auth/session";
import { requirePermission, scopesForPermission } from "@/server/permissions/service";

export async function requireWorkspacePrincipal() {
  const cookieStore = await cookies();
  const principal = await currentPrincipalFromCookie(cookieStore.get("app_session")?.value);
  if (!principal) redirect("/login");
  return principal;
}

export async function requireWorkspacePermission(permission: string) {
  const principal = await requireWorkspacePrincipal();
  await requirePermission(principal, permission);
  return principal;
}

export async function canUseWorkspacePermission(permission: string) {
  const principal = await requireWorkspacePrincipal();
  return (await scopesForPermission(principal, permission)).length > 0;
}
