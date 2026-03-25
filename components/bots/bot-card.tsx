import { Badge } from "@/components/ui/badge";
import type { BotRecord } from "@/features/bots/types";

type BotCardProps = {
  bot: BotRecord;
};

const statusMap = {
  活跃: "border-emerald-200 bg-emerald-50 text-emerald-700",
  空闲: "border-amber-200 bg-amber-50 text-amber-700",
  草稿: "border-slate-200 bg-slate-100 text-slate-600",
} as const;

export function BotCard({ bot }: BotCardProps) {
  return (
    <button
      type="button"
      className="w-full appearance-none border-0 bg-transparent p-0 text-left"
    >
      <div className="app-card overflow-hidden">
        <div className="flex min-h-[72px] items-center gap-3 border-b border-[#e7eef6] bg-[linear-gradient(180deg,#f2f7fd_0%,#eef4fb_100%)] px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-white text-lg shadow-[0_4px_10px_rgba(15,23,42,0.04)]">
            {bot.emoji}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <div className="truncate text-title text-[18px] font-semibold tracking-[-0.02em]">
                {bot.name}
              </div>
              <Badge
                className={`shrink-0 rounded-[999px] border px-2.5 py-1 text-[10px] font-semibold shadow-none ${statusMap[bot.status]}`}
              >
                {bot.status}
              </Badge>
            </div>
            <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#98a2b3]">
              {bot.code}
            </div>
          </div>
        </div>

        <div className="min-h-[88px] border-b border-[#eef2f6] bg-white p-4">
          <p className="line-clamp-2 text-[13px] leading-6 text-[#667085]">
            {bot.description}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {bot.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-[999px] border border-[#e5ebf2] bg-[#f8fafc] px-2.5 py-1 text-[10px] font-medium text-[#5d7898]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="grid min-h-[60px] grid-cols-4 bg-white">
          {bot.metrics.map((metric) => (
            <div
              key={metric.label}
              className="flex flex-col items-center justify-center border-r border-[#eef2f6] px-3 py-2.5 text-center last:border-r-0"
            >
              <div className="truncate leading-none text-title text-[16px] font-semibold">
                {metric.value}
              </div>
              <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.05em] text-[#98a2b3]">
                {metric.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </button>
  );
}
