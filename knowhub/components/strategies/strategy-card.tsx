import type { StrategyRecord } from "@/knowhub/features/strategies/types";
import { strategyAccentMap } from "./strategy-colors";

type StrategyCardProps = {
  item: StrategyRecord;
};

export function StrategyCard({ item }: StrategyCardProps) {
  const accent = strategyAccentMap[item.category].solid;

  return (
    <div className="overflow-hidden rounded-[14px] border border-[#d8e1eb] bg-white shadow-[0_8px_22px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-[2px] hover:border-[#b8d0ea] hover:shadow-[0_12px_26px_rgba(15,23,42,0.07)]">
      <div className="flex min-h-[172px] flex-col px-4 py-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-5 shrink-0 rounded-full"
                style={{
                  backgroundColor: accent,
                }}
              />
              <div className="text-title text-[15px] font-semibold tracking-[-0.02em]">
                {item.name}
              </div>
            </div>
          </div>
          <div
            className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{ backgroundColor: `${accent}14`, color: accent }}
          >
            调用 {item.usageCount}
          </div>
        </div>
        <div className="mt-2 line-clamp-2 min-h-[48px] text-[13px] leading-6 text-[#667085]">
          {item.summary}
        </div>
        <div className="mt-auto pt-2 text-[12px]">
          <div className="rounded-[12px] border border-[#eef2f6] bg-[#fbfcfe] px-3 py-2 text-[#5f6f82]">
            <span className="text-[#98a2b3]">{item.metaLabel}</span>
            <span className="ml-2 text-title font-medium">{item.metaValue}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
