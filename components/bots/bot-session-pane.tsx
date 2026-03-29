"use client";

import { useEffect, useState } from "react";

import type {
  NanobotSessionDetail,
  NanobotSessionSummary,
  NanobotTurnView,
} from "@/features/bots/types";

type BotSessionPaneProps = {
  sessions: NanobotSessionSummary[];
  currentKey: string | null;
  currentDetail: NanobotSessionDetail | null;
  expandedSessionKey: string;
  onOpenSession: (sessionKey: string, anchor?: string) => void | Promise<void>;
  onDeleteSession: (sessionKey: string) => void | Promise<void>;
  onStartNewSession: () => void;
};

function buildTurnNavTitle(
  turn: { index: number; anchor: string; title: string },
  detailTurn?: NanobotTurnView,
) {
  const content = detailTurn?.user_message?.content || turn.title || "";
  const text = content.replace(/\s+/g, " ").trim();

  if (!text) {
    return `第 ${turn.index} 轮`;
  }

  return text.length > 30 ? `${text.slice(0, 30)}...` : text;
}

export function BotSessionPane({
  sessions,
  currentKey,
  currentDetail,
  expandedSessionKey,
  onOpenSession,
  onDeleteSession,
  onStartNewSession,
}: BotSessionPaneProps) {
  const [menuSessionKey, setMenuSessionKey] = useState("");

  useEffect(() => {
    if (!menuSessionKey) {
      return;
    }

    function handleDocumentClick() {
      setMenuSessionKey("");
    }

    document.addEventListener("click", handleDocumentClick);
    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, [menuSessionKey]);

  return (
    <aside className="app-card flex min-h-0 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#eef2f6] px-4 py-3">
        <div className="text-[15px] font-semibold text-title">会话列表</div>
        <div className="text-[12px] text-[#7f8ea3]">共 {sessions.length} 个</div>
      </div>
      <div className="border-b border-[#f0f4f8] px-4 py-3">
        <button
          type="button"
          onClick={() => {
            setMenuSessionKey("");
            onStartNewSession();
          }}
          className="h-[32px] w-full rounded-[8px] border border-[#dbe5f0] px-3 text-[12px] font-medium text-[#356da8] transition-colors hover:border-[#bfd7f2] hover:bg-[#eef5fd]"
        >
          新会话
        </button>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {sessions.length ? (
          sessions.map((session) => {
            const active = session.key === currentKey;
            const expanded = session.key === expandedSessionKey;
            const detailTurns =
              active && currentDetail?.key === session.key
                ? currentDetail.turns
                : [];

            return (
              <div
                key={session.key}
                className={[
                  "rounded-[10px] border transition-colors",
                  active
                    ? "border-[#bfd7f2] bg-[#f8fbfe]"
                    : "border-[#e8eef5] bg-white",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3 px-3 py-3">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuSessionKey("");
                      void onOpenSession(session.key);
                    }}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="line-clamp-1 text-[13px] font-semibold text-title">
                      {session.title || session.key}
                    </div>
                    <div className="mt-1 truncate text-[11px] text-[#98a2b3]">
                      {session.updated_label || "未使用"}
                    </div>
                  </button>
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      aria-label="会话操作"
                      onClick={(event) => {
                        event.stopPropagation();
                        setMenuSessionKey((current) =>
                          current === session.key ? "" : session.key,
                        );
                      }}
                      className="flex h-[24px] min-w-[24px] items-center justify-center rounded-[6px] border border-[#e4edf6] bg-white px-2 text-[12px] text-[#7f8ea3] transition-colors hover:border-[#bfd7f2] hover:text-[#356da8]"
                    >
                      ...
                    </button>
                    {menuSessionKey === session.key ? (
                      <div
                        className="absolute right-0 top-[28px] z-10 w-[96px] rounded-[8px] border border-[#dbe5f0] bg-white p-1 shadow-[0_12px_24px_rgba(15,23,42,0.08)]"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setMenuSessionKey("");
                            void onDeleteSession(session.key);
                          }}
                          className="flex w-full rounded-[6px] px-2.5 py-2 text-left text-[12px] text-[#c2410c] transition-colors hover:bg-[#fff4ed]"
                        >
                          删除会话
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMenuSessionKey("");
                    void onOpenSession(session.key);
                  }}
                  className="flex w-full items-start justify-between gap-3 px-3 pb-3 text-left"
                >
                  <div className="min-w-0">
                    <div className="truncate text-[11px] text-[#98a2b3]">
                      {session.key}
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-[11px] text-[#7f8ea3]">
                    <div>{session.turn_count} 轮</div>
                  </div>
                </button>
                {expanded ? (
                  <div className="border-t border-[#eef2f6] px-3 py-3">
                    <div className="grid gap-2">
                      {session.turns.length ? (
                        session.turns.map((turn) => {
                          const detailTurn = detailTurns.find(
                            (item) => item.anchor === turn.anchor,
                          );
                          return (
                            <button
                              key={`${session.key}-${turn.anchor}`}
                              type="button"
                              onClick={() =>
                                void onOpenSession(session.key, turn.anchor)
                              }
                              className="flex min-w-0 items-center gap-3 rounded-[8px] border border-[#edf2f7] bg-white px-2.5 py-2 text-left transition-colors hover:border-[#d8e8fa] hover:bg-[#eef5fd]"
                            >
                              <span className="shrink-0 text-[11px] text-[#98a2b3]">
                                #{turn.index}
                              </span>
                              <span className="min-w-0 flex-1 truncate text-[12px] text-title">
                                {buildTurnNavTitle(turn, detailTurn)}
                              </span>
                            </button>
                          );
                        })
                      ) : (
                        <div className="text-[12px] text-[#98a2b3]">
                          当前没有轮次
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })
        ) : (
          <div className="rounded-[10px] border border-dashed border-[#d6e0eb] bg-[#fafbfd] px-4 py-6 text-[12px] leading-6 text-[#7f8ea3]">
            还没有会话。发送第一条消息后，这里会自动生成会话列表。
          </div>
        )}
      </div>
    </aside>
  );
}
