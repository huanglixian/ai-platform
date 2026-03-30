import { ComingSoonPanel } from "@/knowhub/components/common/coming-soon-panel";
import { KnowHubPageShell } from "@/knowhub/components/layout/knowhub-page-shell";

export function KnowHubRetrievalPage() {
  return (
    <KnowHubPageShell
      title="检索测试"
      description="这里后续承接面向知识内容的检索测试与效果验证。"
    >
      <ComingSoonPanel
        title="检索测试暂未展开"
        description="当前先保留路由占位，后续再结合知识中心的数据形态落检索验证页面。"
      />
    </KnowHubPageShell>
  );
}
