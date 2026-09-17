import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { AppPage } from "@/components/patterns/app-page";
import { DataTablePanel } from "@/components/patterns/data-table-panel";
import { EmptyState } from "@/components/patterns/empty-state";
import { PageHeader } from "@/components/patterns/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { listRoles } from "@/server/permissions/service";
import { requireWorkspacePermission } from "../../_server/principal";

export default async function RolesPage() {
  await requireWorkspacePermission("system.roles.read");
  const roles = await listRoles();

  return (
    <AppPage scroll="workspace">
      <PageHeader meta={`${roles.length} 个角色`} title="角色" />
      <DataTablePanel>
        {roles.length ? (
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-muted text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">角色</th>
                <th className="px-4 py-3 font-medium">说明</th>
                <th className="px-4 py-3 font-medium">已分配用户</th>
                <th className="px-4 py-3 font-medium"><span className="sr-only">操作</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {roles.map((role) => (
                <tr className="hover:bg-muted/50" key={role.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{role.name}</span>
                      {role.system ? <StatusBadge>系统角色</StatusBadge> : null}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{role.code}</p>
                  </td>
                  <td className="max-w-lg px-4 py-3 text-muted-foreground">{role.description || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{role.userCount}</td>
                  <td className="px-4 py-3 text-right">
                    <Link className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover" href={`/system/roles/${role.id}`}>
                      查看与编辑 <ArrowRight aria-hidden="true" className="size-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <EmptyState title="暂无角色" />}
      </DataTablePanel>
    </AppPage>
  );
}
