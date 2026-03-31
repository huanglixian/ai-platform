import { ComingSoonPanel } from "@/knowhub/components/shared/coming-soon-panel";
import { KnowHubPageShell } from "@/knowhub/components/layout/knowhub-page-shell";

export function KnowHubPipelinesPage() {
  return (
    <KnowHubPageShell>
      <ComingSoonPanel
        title="处理中心暂未展开"
        description="这一栏后续会承接知识处理编排、执行批次和任务状态。当前先保留统一入口。"
      />
    </KnowHubPageShell>
  );
}
