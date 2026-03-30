import type { LucideIcon } from "lucide-react";

type FlowStageCardProps = {
  title: string;
  summary: string;
  metric: string;
  icon: LucideIcon;
  accent: string;
  index: number;
};

export function FlowStageCard({
  title,
  summary,
  metric,
  icon: Icon,
  accent,
  index,
}: FlowStageCardProps) {
  return (
    <div className="min-w-0 rounded-[14px] border border-[#dce6f0] bg-white px-4 py-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px]"
          style={{ backgroundColor: `${accent}14`, color: accent }}
        >
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div
          className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{ backgroundColor: accent, color: "#fff" }}
        >
          {String(index).padStart(2, "0")}
        </div>
      </div>
      <div className="mt-2.5 space-y-1">
        <div className="text-title text-[14px] font-semibold tracking-[-0.01em]">
          {title}
        </div>
        <div className="min-h-[44px] text-[12px] leading-5 text-[#667085]">
          {summary}
        </div>
      </div>
      <div
        className="mt-3 rounded-[10px] border px-3 py-2 text-[11px] font-medium"
        style={{
          borderColor: `${accent}30`,
          backgroundColor: `${accent}10`,
          color: accent,
        }}
      >
        {metric}
      </div>
    </div>
  );
}
