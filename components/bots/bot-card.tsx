import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { NanobotAgentSummary } from "@/features/bots/types";

type BotCardProps = {
  agent: NanobotAgentSummary;
};

function formatLastSessionTime(value: string) {
  if (!value) {
    return "最后会话 未使用";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return `最后会话 ${value}`;
  }

  const pad = (input: number) => String(input).padStart(2, "0");
  return `最后会话 ${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function BotCard({ agent }: BotCardProps) {
  return (
    <Link
      href={`/bots/${encodeURIComponent(agent.id)}`}
      className="block w-full"
    >
      <div className="app-card overflow-hidden">
        <div className="flex min-h-[72px] items-center gap-3 border-b border-[#e7eef6] bg-[linear-gradient(180deg,#f2f7fd_0%,#eef4fb_100%)] px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-white text-lg shadow-[0_4px_10px_rgba(15,23,42,0.04)]">
            自
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <div className="truncate text-title text-[18px] font-semibold tracking-[-0.02em]">
                {agent.name || agent.id}
              </div>
              <Badge
                className={[
                  "shrink-0 rounded-[999px] border border-[#d8e8fa] bg-[#eef5fd] px-2.5 py-1 text-[10px] font-semibold text-[#1a4d87] shadow-none",
                ].join(" ")}
              >
                已接入
              </Badge>
            </div>
            <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#98a2b3]">
              {formatLastSessionTime(agent.last_session_at)}
            </div>
          </div>
        </div>

        <div className="min-h-[88px] border-b border-[#eef2f6] bg-white p-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-[10px] bg-[#f8fbfe] px-3 py-2.5">
              <div className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#98a2b3]">
                会话数
              </div>
              <div className="mt-1 text-[20px] font-semibold leading-none text-title">
                {agent.session_count}
              </div>
            </div>
            <div className="rounded-[10px] bg-[#f8fbfe] px-3 py-2.5">
              <div className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#98a2b3]">
                技能数
              </div>
              <div className="mt-1 text-[20px] font-semibold leading-none text-title">
                {agent.skill_count}
              </div>
            </div>
            <div className="rounded-[10px] bg-[#f8fbfe] px-3 py-2.5">
              <div className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#98a2b3]">
                定时任务
              </div>
              <div className="mt-1 text-[20px] font-semibold leading-none text-title">
                {agent.cron_count}
              </div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="max-w-full truncate rounded-[999px] border border-[#e5ebf2] bg-[#f8fafc] px-2.5 py-1 text-[10px] font-medium text-[#5d7898]">
              {agent.model_name || "-"}
            </span>
          </div>
        </div>

      </div>
    </Link>
  );
}
