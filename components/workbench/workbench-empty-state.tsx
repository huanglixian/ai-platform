"use client";

import { useEffect, useState } from "react";

type WorkbenchEmptyStateProps = {
  modelName: string;
  sending: boolean;
  status: string;
  initialValue?: string;
  resetKey?: string;
  onSend: (value: string) => void | Promise<void>;
};

export function WorkbenchEmptyState({
  modelName,
  sending,
  status,
  initialValue = "",
  resetKey = "",
  onSend,
}: WorkbenchEmptyStateProps) {
  const [value, setValue] = useState(initialValue);
  const [isComposing, setIsComposing] = useState(false);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue, resetKey]);

  async function handleSend() {
    const content = value.trim();
    if (!content || sending) {
      return;
    }
    await onSend(content);
    setValue("");
  }

  return (
    <section className="flex h-full min-h-0 w-full justify-center px-6 pt-14 pb-10">
      <div className="flex w-full max-w-[720px] flex-col items-center">
        <div className="mb-8 w-full text-center">
          <div className="text-[40px] font-semibold tracking-[-0.05em] text-title">
            今天要处理什么？
          </div>
        </div>

        <div className="w-full rounded-[24px] border border-[#dbe5f0] bg-white p-5 shadow-[0_20px_48px_rgba(15,23,42,0.06)]">
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
            placeholder="输入问题或任务，开始对话"
            className="min-h-[132px] w-full resize-none border-0 bg-transparent px-1 py-1 text-[16px] leading-8 text-title outline-none placeholder:text-[#98a2b3]"
          />
          <div className="mt-4 flex items-center justify-between gap-4 border-t border-[#eef2f6] pt-4">
            <div className="min-w-0 truncate text-[12px] text-[#7f8ea3]">
              {status
                ? `处理中：${status}`
                : sending
                  ? "nanobot 正在处理这条消息..."
                  : `模型：${modelName || "-"}`}
            </div>
            <button
              type="button"
              disabled={sending}
              onClick={() => void handleSend()}
              className="h-[42px] rounded-[12px] bg-[#0368b3] px-5 text-[14px] font-medium text-white transition-colors hover:bg-[#1a4d87] disabled:cursor-not-allowed disabled:bg-[#7eaed6]"
            >
              {sending ? "处理中..." : "发送"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
