import { Badge } from "@/components/ui/badge";
import type { StrategyRecord } from "@/knowhub/types";

type StrategyCardProps = {
  item: StrategyRecord;
};

const accentMap = {
  preprocess: "#d08a33",
  chunking: "#1f8a57",
} as const;

const categoryLabelMap = {
  preprocess: "预处理策略库",
  chunking: "切片策略库",
} as const;

const statusLabelMap = {
  active: "已启用",
  draft: "草稿",
} as const;

export function StrategyCard({ item }: StrategyCardProps) {
  const accent = accentMap[item.category];

  return (
    <div className="overflow-hidden rounded-[14px] border border-[#d8e1eb] bg-white shadow-[0_10px_26px_rgba(15,23,42,0.05)] transition-all hover:-translate-y-[2px] hover:border-[#b8d0ea] hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)]">
      <div
        className="h-1.5"
        style={{
          background: `linear-gradient(90deg, ${accent} 0%, color-mix(in srgb, ${accent} 58%, white) 100%)`,
        }}
      />
      <div className="space-y-4 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{categoryLabelMap[item.category]}</Badge>
              <Badge variant={item.status === "active" ? "secondary" : "outline"}>
                {statusLabelMap[item.status]}
              </Badge>
            </div>
            <div className="text-title text-[16px] font-semibold tracking-[-0.02em]">
              {item.name}
            </div>
          </div>
          <div
            className="rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{ backgroundColor: `${accent}14`, color: accent }}
          >
            {item.version}
          </div>
        </div>
        <div className="min-h-[64px] text-[13px] leading-6 text-[#667085]">
          {item.summary}
        </div>
        <div className="rounded-[12px] bg-[#f7fafd] px-3 py-2.5 text-[12px] text-[#5f6f82]">
          适用范围：{item.scope}
        </div>
        <div className="grid grid-cols-2 gap-2 text-[12px]">
          <div className="rounded-[12px] border border-[#eef2f6] px-3 py-2.5">
            <div className="text-[#98a2b3]">维护方</div>
            <div className="mt-1 text-title font-medium">{item.owner}</div>
          </div>
          <div className="rounded-[12px] border border-[#eef2f6] px-3 py-2.5">
            <div className="text-[#98a2b3]">使用次数</div>
            <div className="mt-1 text-title font-medium">{item.usageCount}</div>
          </div>
          <div className="rounded-[12px] border border-[#eef2f6] px-3 py-2.5">
            <div className="text-[#98a2b3]">最近更新</div>
            <div className="mt-1 text-title font-medium">{item.updatedAt}</div>
          </div>
          <div className="rounded-[12px] border border-[#eef2f6] px-3 py-2.5">
            <div className="text-[#98a2b3]">策略模式</div>
            <div className="mt-1 text-title font-medium">
              {item.status === "active" ? "已上线" : "待调整"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
