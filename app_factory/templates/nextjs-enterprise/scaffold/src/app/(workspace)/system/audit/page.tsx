import { AppPage } from "@/components/patterns/app-page";
import { DataTablePanel } from "@/components/patterns/data-table-panel";
import { EmptyState } from "@/components/patterns/empty-state";
import { PageHeader } from "@/components/patterns/page-header";
import { formatDateTime } from "@/lib/format";
import { listAuditEvents } from "@/server/audit/service";
import { requireWorkspacePermission } from "../../_server/principal";

export default async function AuditPage() {
  await requireWorkspacePermission("system.audit.read");
  const events = await listAuditEvents();
  return (
    <AppPage scroll="workspace">
      <PageHeader meta={`${events.length} 条记录`} title="审计" />
      <DataTablePanel>
        {events.length ? (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-muted text-xs text-muted-foreground"><tr><th className="px-4 py-3 font-medium">时间</th><th className="px-4 py-3 font-medium">操作</th><th className="px-4 py-3 font-medium">资源</th><th className="px-4 py-3 font-medium">结果</th></tr></thead>
            <tbody className="divide-y divide-border">
              {events.map((event) => <tr className="hover:bg-muted/50" key={event.id}><td className="px-4 py-3 text-muted-foreground">{formatDateTime(event.createdAt)}</td><td className="px-4 py-3 font-medium">{event.action}</td><td className="px-4 py-3 text-muted-foreground">{event.entityType} · {event.entityId}</td><td className="px-4 py-3 text-muted-foreground">{event.outcome}</td></tr>)}
            </tbody>
          </table>
        ) : <EmptyState description="重要的管理和业务操作会记录在这里。" title="暂无审计记录" />}
      </DataTablePanel>
    </AppPage>
  );
}
