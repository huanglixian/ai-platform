import { AppShell } from "@/components/layout/app-shell";
import { navigationItems } from "@/config/navigation";
import { scopesForPermission } from "@/server/permissions/service";
import { ensureApplicationPermissionCatalog } from "./_server/permission-catalog";
import { requireWorkspacePrincipal } from "./_server/principal";

const appName = "{{APP_NAME_JS}}";

export const dynamic = "force-dynamic";

export default async function WorkspaceLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await ensureApplicationPermissionCatalog();
  const principal = await requireWorkspacePrincipal();
  const allowedHrefs = (await Promise.all(navigationItems.map(async (item) => ({
    href: item.href,
    allowed: (await scopesForPermission(principal, item.permission)).length > 0,
  })))).filter((item) => item.allowed).map((item) => item.href);

  return <AppShell allowedHrefs={allowedHrefs} appName={appName} principal={principal}>{children}</AppShell>;
}
