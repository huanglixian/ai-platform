import { ComingSoonPanel } from "@/knowhub/components/shared/coming-soon-panel";
import { KnowHubPageShell } from "@/knowhub/components/layout/knowhub-page-shell";

export function KnowHubKnowledgePage() {
  return (
    <KnowHubPageShell>
      <ComingSoonPanel
        title="知识中心暂未展开"
        description="这一栏后续会承接知识内容编目、知识库管理和对外发布状态。当前先保留统一入口。"
      />
    </KnowHubPageShell>
  );
}
