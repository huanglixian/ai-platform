"use client";

import { memo, useRef } from "react";

import type {
  NanobotMessageView,
  NanobotSessionDetail,
  NanobotTurnView,
} from "@/features/bots/types";
import { BotMessageMarkdown } from "./bot-message-markdown";

function MessageCard({ message }: { message: NanobotMessageView }) {
  const isAssistant = message.role === "assistant";
  const isUser = message.role === "user";

  return (
    <article
      className={[
        "rounded-[10px] border px-3 py-2.5",
        isUser
          ? "border-[#e4edf6] bg-white"
          : isAssistant
            ? "border-[#d8e8fa] bg-[#eef5fd]"
            : "border-[#edf2f7] bg-[#fafbfd]",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className={[
            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
            isUser
              ? "bg-[#f3f6fa] text-[#51657d]"
              : isAssistant
                ? "bg-white text-[#356da8]"
                : "bg-white text-[#7f8ea3]",
          ].join(" ")}
        >
          {message.role_label}
        </span>
        <span className="text-[11px] text-[#98a2b3]">{message.timestamp || "-"}</span>
      </div>
      {message.tool_summary ? (
        <div className="mt-1.5 rounded-[8px] bg-white/80 px-2.5 py-1.5 text-[12px] text-[#51657d]">
          {message.tool_summary}
        </div>
      ) : null}
      <BotMessageMarkdown content={message.content || "(empty)"} />
    </article>
  );
}

function TurnCard({ turn }: { turn: NanobotTurnView }) {
  return (
    <section className="rounded-[12px] border border-[#e4edf6] bg-white px-3.5 py-2.5">
      <div className="text-[11px] font-semibold text-[#7f8ea3]">
        第 {turn.index} 轮
      </div>
      <div className="mt-2.5 grid gap-2">
        {turn.user_message ? <MessageCard message={turn.user_message} /> : null}
        {turn.process_messages.length ? (
          <details className="rounded-[10px] border border-[#edf2f7] bg-[#fafbfd]">
            <summary className="cursor-pointer px-3 py-2 text-[12px] font-medium text-[#51657d]">
              思考过程（{turn.process_messages.length} 条）
            </summary>
            <div className="grid gap-2 border-t border-[#edf2f7] p-2.5">
              {turn.process_messages.map((message, index) => (
                <MessageCard
                  key={`${turn.anchor}-process-${index}`}
                  message={message}
                />
              ))}
            </div>
          </details>
        ) : null}
        {turn.final_message ? <MessageCard message={turn.final_message} /> : null}
      </div>
    </section>
  );
}

type BotTranscriptPaneProps = {
  detail: NanobotSessionDetail | null;
  noHover?: boolean;
};

export const BotTranscriptPane = memo(function BotTranscriptPane({
  detail,
  noHover = false,
}: BotTranscriptPaneProps) {
  const transcriptRef = useRef<HTMLDivElement | null>(null);

  return (
    <section
      className={[
        noHover ? "app-card-no-hover" : "app-card",
        "flex min-h-0 flex-col overflow-hidden",
      ].join(" ")}
    >
      <div className="flex items-center justify-between border-b border-[#eef2f6] px-4 py-3">
        <div className="text-[15px] font-semibold text-title">对话记录</div>
        <div className="flex items-center gap-3">
          <div className="text-[12px] text-[#98a2b3]">
            {detail
              ? `${detail.turn_count} 轮 · ${detail.message_count} 条消息`
              : "等待第一条输入"}
          </div>
          <button
            type="button"
            onClick={() =>
              transcriptRef.current?.scrollTo({ top: 0, behavior: "smooth" })
            }
            className="h-[32px] rounded-[8px] border border-[#dbe5f0] bg-white px-3 text-[12px] font-medium text-[#356da8] transition-colors hover:border-[#bfd7f2] hover:bg-[#eef5fd]"
          >
            回到顶部
          </button>
        </div>
      </div>
      <div ref={transcriptRef} className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-4">
          {detail?.turns.length ? (
            detail.turns.map((turn) => (
              <div key={turn.anchor} id={turn.anchor}>
                <TurnCard turn={turn} />
              </div>
            ))
          ) : (
            <div className="rounded-[10px] border border-dashed border-[#d6e0eb] bg-[#fafbfd] px-4 py-10 text-center text-[13px] leading-6 text-[#7f8ea3]">
              当前还没有对话内容。可以直接在下方输入消息开始一个新会话。
            </div>
          )}
        </div>
      </div>
    </section>
  );
});
