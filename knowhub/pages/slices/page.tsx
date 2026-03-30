import { KnowHubPageShell } from "@/knowhub/components/layout/knowhub-page-shell";
import { StrategyLibraryPanel } from "@/knowhub/components/strategies/strategy-library-panel";
import { strategyRecords } from "@/knowhub/data/strategies";

export function KnowHubSlicesPage() {
  return (
    <KnowHubPageShell
      title="切片策略库"
      description="围绕章节标题、父子上下文和问答结构维护切片规则，作为知识内容组织的标准化入口。"
    >
      <StrategyLibraryPanel
        title="切片策略列表"
        description="页面形态参考技能中心，但卡片表达更偏规则摘要、适用范围和维护信息。"
        category="chunking"
        records={strategyRecords}
      />
    </KnowHubPageShell>
  );
}
