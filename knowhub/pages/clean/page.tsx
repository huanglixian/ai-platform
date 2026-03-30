import { KnowHubPageShell } from "@/knowhub/components/layout/knowhub-page-shell";
import { StrategyLibraryPanel } from "@/knowhub/components/strategies/strategy-library-panel";
import { strategyRecords } from "@/knowhub/data/strategies";

export function KnowHubCleanPage() {
  return (
    <KnowHubPageShell>
      <StrategyLibraryPanel
        title="预处理策略列表"
        description="页面形态参考技能中心，但卡片表达更偏规则摘要、适用范围和维护信息。"
        category="preprocess"
        records={strategyRecords}
      />
    </KnowHubPageShell>
  );
}
