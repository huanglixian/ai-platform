import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { AppPage } from "@/components/patterns/app-page";
import { PageHeader } from "@/components/patterns/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { listPermissionDefinitions } from "@/server/permissions/registry";
import { getRoleDetail } from "@/server/permissions/service";
import { canUseWorkspacePermission, requireWorkspacePermission } from "../../../_server/principal";
import { RoleEditor } from "./_components/role-editor";

export default async function RoleDetailPage({ params }: { params: Promise<{ roleId: string }> }) {
  await requireWorkspacePermission("system.roles.read");
  const { roleId } = await params;
  const [role, permissions, canManage] = await Promise.all([
    getRoleDetail(roleId),
    listPermissionDefinitions(),
    canUseWorkspacePermission("system.roles.manage"),
  ]);
  if (!role) notFound();

  return (
    <AppPage>
      <PageHeader
        leading={<Link aria-label="返回角色列表" className="rounded-md p-1 text-muted-foreground hover:bg-muted" href="/system/roles"><ChevronLeft className="size-5" /></Link>}
        meta={role.system ? <StatusBadge>系统角色</StatusBadge> : undefined}
        title={role.name}
      />
      <RoleEditor canManage={canManage} permissions={permissions} role={role} />
    </AppPage>
  );
}
