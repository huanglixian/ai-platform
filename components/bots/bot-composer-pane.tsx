"use client";

import { useState } from "react";

type BotComposerPaneProps = {
  value: string;
  sending: boolean;
  status: string;
  modelName: string;
  onChange: (value: string) => void;
  onSend: () => void | Promise<void>;
};

export function BotComposerPane({
  value,
  sending,
  status,
  modelName,
  onChange,
  onSend,
}: BotComposerPaneProps) {
  const [isComposing, setIsComposing] = useState(false);

  return (
    <section className="app-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#eef2f6] px-4 py-3">
        <div className="text-[15px] font-semibold text-title">发送消息</div>
        <div className="text-[12px] text-[#7f8ea3]">&nbsp;</div>
      </div>
      <div className="grid gap-3 px-4 py-4">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !isComposing &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              if (!sending) {
                void onSend();
              }
            }
          }}
          placeholder="输入你的问题，在当前自由体下直接和 nanobot 对话"
          className="min-h-[120px] resize-none rounded-[12px] border border-[#dbe5f0] bg-white px-4 py-3 text-[13px] leading-6 text-title outline-none transition-colors placeholder:text-[#98a2b3] focus:border-[#6f96c4]"
        />
        <div className="flex items-center justify-between gap-3">
          <div className="truncate text-[12px] text-[#7f8ea3]">
            {status
              ? `处理中：${status}`
              : sending
                ? "nanobot 正在处理这条消息..."
                : `模型：${modelName || "-"}`}
          </div>
          <button
            type="button"
            disabled={sending}
            onClick={() => void onSend()}
            className="h-[36px] rounded-[8px] bg-[#0368b3] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#1a4d87] disabled:cursor-not-allowed disabled:bg-[#7eaed6]"
          >
            {sending ? "处理中..." : "发送"}
          </button>
        </div>
      </div>
    </section>
  );
}
