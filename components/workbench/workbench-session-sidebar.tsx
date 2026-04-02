"use client";

import type { ReactNode } from "react";

type WorkbenchSessionSidebarProps = {
  expanded: boolean;
  sessionCount: number;
  onToggle: () => void;
  onStartNewSession: () => void;
  children: ReactNode;
};

export function WorkbenchSessionSidebar({
  expanded,
  sessionCount,
  onToggle,
  onStartNewSession,
  children,
}: WorkbenchSessionSidebarProps) {
  return (
    <aside
      className={[
        "min-h-0 h-full transition-[width] duration-200 ease-out",
        expanded ? "w-[320px]" : "w-[64px]",
      ].join(" ")}
    >
      {expanded ? (
        <div className="flex h-full min-h-0 flex-col pr-4">
          <div className="min-h-0 flex-1 overflow-hidden rounded-r-[14px] border border-[#dbe5f0] bg-white shadow-[0_4px_10px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between border-b border-[#eef2f6] px-3 py-3">
              <button
                type="button"
                onClick={onToggle}
                className="rounded-[8px] border border-[#dbe5f0] px-3 py-1.5 text-[12px] font-medium text-[#51657d] transition-colors hover:bg-[#f7fafc]"
              >
                收起
              </button>
              <button
                type="button"
                onClick={onStartNewSession}
                className="rounded-[8px] bg-[#0368b3] px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-[#1a4d87]"
              >
                新会话
              </button>
            </div>
            <div className="mt-1 min-h-0 h-[calc(100%-61px)] overflow-hidden">{children}</div>
          </div>
        </div>
      ) : (
        <div className="flex h-full min-h-0 flex-col items-center gap-3 px-2 py-3">
          <button
            type="button"
            onClick={onToggle}
            className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] border border-[#dbe5f0] bg-white text-[12px] font-medium text-[#356da8] shadow-[0_4px_10px_rgba(15,23,42,0.05)] transition-colors hover:border-[#bfd7f2] hover:bg-[#eef5fd]"
            aria-label="展开会话历史"
          >
            会话
          </button>
          <button
            type="button"
            onClick={onStartNewSession}
            className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-[#0368b3] text-[18px] font-medium text-white shadow-[0_6px_16px_rgba(3,104,179,0.18)] transition-colors hover:bg-[#1a4d87]"
            aria-label="新建会话"
          >
            +
          </button>
          <div className="mt-auto text-[11px] font-medium text-[#98a2b3]">
            {sessionCount}
          </div>
        </div>
      )}
    </aside>
  );
}
