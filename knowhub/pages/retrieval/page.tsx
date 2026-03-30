import { ComingSoonPanel } from "@/knowhub/components/common/coming-soon-panel";
import { KnowHubPageShell } from "@/knowhub/components/layout/knowhub-page-shell";

export function KnowHubRetrievalPage() {
  return (
    <KnowHubPageShell>
      <ComingSoonPanel
        title="检索测试暂未展开"
        description="当前先保留路由占位，后续再结合知识中心的数据形态落检索验证页面。"
      />
    </KnowHubPageShell>
  );
}
