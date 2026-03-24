import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
    <button type="button" className="w-full text-left">
      <Card className="overflow-hidden rounded-[10px] border border-border bg-white transition-all hover:-translate-y-0.5 hover:border-[#7fa8d3] hover:shadow-[0_12px_24px_rgba(26,77,135,0.08)]">
        <CardContent className="p-0">
          <div className="grid min-h-[232px] gap-0 grid-rows-[72px_minmax(0,1fr)_78px]">
            <div className="flex items-center gap-3 border-b border-border bg-[linear-gradient(180deg,#f5f9ff_0%,#eef5fd_100%)] px-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] border border-[#d7e3ef] bg-white text-xl shadow-[0_6px_14px_rgba(15,23,42,0.04)]">
                {bot.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate text-title text-[20px] font-semibold tracking-[-0.02em]">
                    {bot.name}
                  </div>
                  <Badge
                    className={`shrink-0 rounded-[999px] border px-2.5 py-1 text-[11px] font-semibold shadow-none ${statusMap[bot.status]}`}
                  >
                    {bot.status}
                  </Badge>
                </div>
                <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-tertiary">
                  {bot.code}
                </div>
              </div>
            </div>

            <div className="min-w-0 border-b border-border p-5">
              <p className="line-clamp-2 text-[14px] leading-6 text-[#3f4956]">
                {bot.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {bot.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-[999px] border border-[#d9e5f2] bg-[#f6f9fc] px-2.5 py-1 text-[11px] font-medium text-[#1a4d87]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {bot.channels.length > 0 ? (
                  bot.channels.map((channel) => (
                    <span
                      key={channel.id}
                      className="rounded-[999px] border border-border bg-white px-2.5 py-1 text-[11px] font-medium text-secondary"
                    >
                      {channel.label}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-tertiary">未绑定渠道</span>
                )}
              </div>
            </div>

            <div className="grid gap-0 grid-cols-3">
              {bot.metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="flex flex-col justify-center border-r border-border bg-[#fbfcfe] px-4 py-3 last:border-r-0"
                >
                  <div className="text-title text-[26px] font-semibold leading-none">
                    {metric.value}
                  </div>
                  <div className="mt-2 text-[11px] font-medium uppercase tracking-[0.08em] text-tertiary">
                    {metric.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-border px-5 py-3 text-xs">
            <div className="font-medium text-[#4d4d4d]">{bot.role}</div>
            <div className="font-medium text-tertiary">{bot.updatedAt}</div>
          </div>
        </CardContent>
      </Card>
    </button>
  );
}
