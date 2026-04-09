"use client";

import { useState, type ReactNode } from "react";

type BotComposerPaneProps = {
  sending: boolean;
  status: string;
  modelName: string;
  metaSlot?: ReactNode;
  title?: string;
  placeholder?: string;
  footerActions?: ReactNode;
  noHover?: boolean;
  initialValue?: string;
  resetKey?: string;
  submitLabel?: string;
  onSend: (value: string) => void | Promise<void>;
};

export function BotComposerPane({
  initialValue = "",
  resetKey = "",
  ...props
}: BotComposerPaneProps) {
  const composerKey = `${resetKey}:${initialValue}`;

  return (
    <BotComposerPaneContent
      key={composerKey}
      initialValue={initialValue}
      {...props}
    />
  );
}

function BotComposerPaneContent({
  sending,
  status,
  modelName,
  title = "发送消息",
  placeholder = "输入你的问题，在当前自由体下直接和 nanobot 对话",
  footerActions,
  metaSlot,
  noHover = false,
  initialValue = "",
  submitLabel = "发送",
  onSend,
}: BotComposerPaneProps) {
  const [value, setValue] = useState(initialValue);
  const [isComposing, setIsComposing] = useState(false);

  async function handleSend() {
    const content = value.trim();
    if (!content || sending) {
      return;
    }
    await onSend(content);
    setValue("");
  }

  return (
    <section
      className={[
        noHover ? "app-card-no-hover" : "app-card",
        "overflow-hidden",
      ].join(" ")}
    >
      <div className="flex items-center justify-between border-b border-[#eef2f6] px-4 py-3">
        <div className="text-[15px] font-semibold text-title">{title}</div>
        <div className="text-[12px] text-[#7f8ea3]">&nbsp;</div>
      </div>
      <div className="grid gap-3 px-4 py-4">
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
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
              void handleSend();
            }
          }}
          placeholder={placeholder}
          className="min-h-[120px] resize-none rounded-[12px] border border-[#dbe5f0] bg-white px-4 py-3 text-[13px] leading-6 text-title outline-none transition-colors placeholder:text-[#98a2b3] focus:border-[#6f96c4]"
        />
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            {metaSlot ? (
              metaSlot
            ) : (
              <div className="truncate text-[12px] text-[#7f8ea3]">
                {status
                  ? `处理中：${status}`
                  : sending
                    ? "nanobot 正在处理这条消息..."
                    : `模型：${modelName || "-"}`}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {footerActions}
            <button
              type="button"
              disabled={sending}
              onClick={() => void handleSend()}
              className="h-[36px] rounded-[8px] bg-[#0368b3] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#1a4d87] disabled:cursor-not-allowed disabled:bg-[#7eaed6]"
            >
              {sending ? "处理中..." : submitLabel}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
