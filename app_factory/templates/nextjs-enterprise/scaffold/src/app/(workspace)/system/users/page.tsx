import { Search } from "lucide-react";

import { AppPage } from "@/components/patterns/app-page";
import { DataTablePanel } from "@/components/patterns/data-table-panel";
import { EmptyState } from "@/components/patterns/empty-state";
import { FilterBar } from "@/components/patterns/filter-bar";
import { PageHeader } from "@/components/patterns/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { listUsers } from "@/server/auth/service";
import { formatDateTime } from "@/lib/format";
import { requireWorkspacePermission } from "../../_server/principal";

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireWorkspacePermission("system.users.read");
  const { q } = await searchParams;
  const users = await listUsers(q);

  return (
    <AppPage scroll="workspace">
      <PageHeader meta={`${users.length} 位用户`} title="用户" />
      <FilterBar>
        <form className="flex w-full max-w-md items-center gap-2" method="get">
          <div className="relative min-w-0 flex-1">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input className="pl-9" defaultValue={q || ""} name="q" placeholder="搜索用户名或显示名称" />
          </div>
          <Button type="submit" variant="outline">搜索</Button>
        </form>
      </FilterBar>
      <DataTablePanel pagination={`共 ${users.length} 位用户`}>
        {users.length ? (
          <>
            <div className="divide-y divide-border sm:hidden">
              {users.map((user) => (
                <article className="grid gap-3 p-4" key={user.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{user.displayName}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{user.username}</p>
                    </div>
                    <StatusBadge status={user.active ? "active" : "inactive"}>{user.active ? "启用" : "停用"}</StatusBadge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">部门</p>
                      <p className="mt-1 truncate">{user.primaryDepartmentName || "未分配"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">角色</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {user.roleCodes.length ? user.roleCodes.map((role) => <StatusBadge key={role}>{role}</StatusBadge>) : "—"}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">创建于 {formatDateTime(user.createdAt)}</p>
                </article>
              ))}
            </div>
            <div className="hidden sm:block">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-muted text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">用户</th>
                    <th className="px-4 py-3 font-medium">部门</th>
                    <th className="px-4 py-3 font-medium">角色</th>
                    <th className="px-4 py-3 font-medium">状态</th>
                    <th className="px-4 py-3 font-medium">创建时间</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((user) => (
                    <tr className="hover:bg-muted/50" key={user.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{user.displayName}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{user.username}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{user.primaryDepartmentName || "未分配"}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {user.roleCodes.length ? user.roleCodes.map((role) => <StatusBadge key={role}>{role}</StatusBadge>) : "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={user.active ? "active" : "inactive"}>{user.active ? "启用" : "停用"}</StatusBadge></td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDateTime(user.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : <EmptyState description="完成受控 Bootstrap 后，用户会显示在这里。" title="暂无匹配用户" />}
      </DataTablePanel>
    </AppPage>
  );
}
