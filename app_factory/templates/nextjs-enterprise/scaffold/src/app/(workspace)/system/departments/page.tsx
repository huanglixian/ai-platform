import { AppPage } from "@/components/patterns/app-page";
import { DataTablePanel } from "@/components/patterns/data-table-panel";
import { EmptyState } from "@/components/patterns/empty-state";
import { PageHeader } from "@/components/patterns/page-header";
import { listDepartments } from "@/server/organization/service";
import { requireWorkspacePermission } from "../../_server/principal";

export default async function DepartmentsPage() {
  await requireWorkspacePermission("system.departments.read");
  const departments = await listDepartments();
  const names = new Map(departments.map((department) => [department.id, department.name]));
  return (
    <AppPage scroll="workspace">
      <PageHeader meta={`${departments.length} 个部门`} title="部门" />
      <DataTablePanel>
        {departments.length ? (
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="bg-muted text-xs text-muted-foreground"><tr><th className="px-4 py-3 font-medium">部门</th><th className="px-4 py-3 font-medium">上级部门</th><th className="px-4 py-3 font-medium">排序</th></tr></thead>
            <tbody className="divide-y divide-border">
              {departments.map((department) => <tr className="hover:bg-muted/50" key={department.id}><td className="px-4 py-3 font-medium">{department.name}</td><td className="px-4 py-3 text-muted-foreground">{department.parentId ? names.get(department.parentId) || "—" : "—"}</td><td className="px-4 py-3 text-muted-foreground">{department.sortOrder}</td></tr>)}
            </tbody>
          </table>
        ) : <EmptyState title="暂无部门" />}
      </DataTablePanel>
    </AppPage>
  );
}
