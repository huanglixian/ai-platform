"use client";

import { useState } from "react";
import { ArrowUp, Sparkles } from "lucide-react";

type AssistantEntryProps = {
  sending: boolean;
  initialValue?: string;
  resetKey?: string;
  onSend: (value: string) => void | Promise<void>;
};

const suggestions = ["帮我梳理当前项目的任务", "推荐适合的业务能力", "从资料中查找相关信息"];

export function AssistantEntry({
  initialValue = "",
  resetKey = "",
  ...props
}: AssistantEntryProps) {
  const emptyStateKey = `${resetKey}:${initialValue}`;

  return (
    <AssistantEntryContent
      key={emptyStateKey}
      initialValue={initialValue}
      {...props}
    />
  );
}

function AssistantEntryContent({
  sending,
  initialValue = "",
  onSend,
}: AssistantEntryProps) {
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
    <section className="relative overflow-hidden rounded-[18px] border border-[#d9e6f2] bg-white shadow-[0_14px_36px_rgba(15,23,42,0.045)]">
      <div className="absolute inset-y-0 left-0 hidden w-[15%] min-w-[166px] max-w-[205px] bg-[radial-gradient(circle_at_18%_18%,#ffffff_0,transparent_36%),linear-gradient(145deg,#e5f2fc,#f5f9fd)] lg:block" />
      <div className="relative grid min-h-[222px] lg:grid-cols-[clamp(166px,15vw,205px)_minmax(0,1fr)]">
        <div className="relative flex flex-col justify-between border-b border-[#dce9f4] px-5 py-4 lg:border-r lg:border-b-0 lg:px-6 lg:py-5">
          <div>
            <div className="grid h-9 w-9 place-items-center rounded-[10px] bg-gradient-to-br from-[#0368b3] to-[#2e7dd2] text-white shadow-[0_8px_20px_rgba(3,104,179,0.2)]"><Sparkles size={17} /></div>
            <div className="mt-4 text-[16px] font-semibold tracking-[-0.02em] text-[#173d63]">AI 助手</div>
            <p className="mt-1.5 max-w-[150px] text-[11px] leading-5 text-[#6d8499]">连接平台能力与业务数据</p>
          </div>
          <div className="mt-4 text-[10px] font-medium tracking-[0.08em] text-[#7e98b0]">INTELLIGENT WORKSPACE</div>
        </div>
        <div className="flex min-w-0 flex-col px-5 py-4 sm:px-6 sm:py-5">
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
            placeholder="描述你的目标、已有资料或期望结果…"
            className="min-h-[114px] w-full flex-1 resize-none rounded-xl border border-[#dce7f1] bg-[#f9fbfd] px-4 py-3 text-[14px] leading-6 text-title outline-none transition-colors placeholder:text-[#9aaabc] focus:border-[#85add5] focus:bg-white focus:ring-4 focus:ring-[#ebf4fc]"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button key={suggestion} type="button" onClick={() => setValue(suggestion)} className="rounded-full border border-[#dce7f1] bg-[#f8fbfe] px-3 py-1.5 text-[11px] text-[#617a91] transition-colors hover:border-[#b8d1e9] hover:bg-[#edf6fd] hover:text-[#1a5c96]">
                  {suggestion}
                </button>
              ))}
            </div>
            <button type="button" disabled={sending} onClick={() => void handleSend()} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#0368b3] px-4 text-[13px] font-medium text-white shadow-[0_7px_16px_rgba(3,104,179,0.18)] transition-colors hover:bg-[#1a4d87] disabled:cursor-not-allowed disabled:bg-[#7eaed6]">
              {sending ? "处理中" : "开始对话"}<ArrowUp size={15} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
