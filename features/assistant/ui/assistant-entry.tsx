"use client";

import { useState } from "react";
import { ArrowUp, Sparkles } from "lucide-react";
import type { KnowledgeOption } from "../knowledge-client";

type AssistantEntryProps = {
  sending: boolean;
  mode: "chat" | "search";
  onModeChange: (mode: "chat" | "search") => void;
  knowledgeOptions: KnowledgeOption[];
  knowledgeId: string;
  onKnowledgeChange: (id: string) => void;
  error?: string;
  initialValue?: string;
  resetKey?: string;
  onSend: (value: string) => void | Promise<void>;
};

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
  mode,
  onModeChange,
  knowledgeOptions,
  knowledgeId,
  onKnowledgeChange,
  error,
}: AssistantEntryProps) {
  const [value, setValue] = useState(initialValue);
  const [isComposing, setIsComposing] = useState(false);

  async function handleSend() {
    const content = value.trim();
    if (!content || sending) {
      return;
    }
    await onSend(content);
  }

  return (
    <section className="relative overflow-hidden rounded-[18px] border border-[#e2d3ce] bg-white shadow-[0_10px_32px_rgba(81,38,39,0.07)]">
      <div className="relative grid lg:min-h-[222px] lg:grid-cols-[clamp(166px,15vw,205px)_minmax(0,1fr)]">
        <div className="relative flex items-center gap-3 overflow-hidden border-b border-[#7e2537] bg-[linear-gradient(145deg,#651d2d_0%,#8d2b3e_65%,#a44451_100%)] px-4 py-3 lg:flex-col lg:items-stretch lg:justify-between lg:gap-0 lg:border-r lg:border-b-0 lg:px-6 lg:py-5">
          <div className="flex min-w-0 items-center gap-3 lg:block">
            <div className="grid h-9 w-9 place-items-center rounded-[10px] border border-white/25 bg-white/12 text-white"><Sparkles size={17} /></div>
            <div className="min-w-0 lg:mt-4">
              <div className="whitespace-nowrap text-[16px] font-semibold tracking-[-0.02em] text-white">AI 助手</div>
              <p className="mt-1.5 hidden max-w-[150px] text-[11px] leading-5 text-[#eed5d5] lg:block">连接平台能力与业务数据</p>
            </div>
          </div>
          <div className="hidden mt-4 text-[9px] font-medium tracking-[0.1em] text-[#dfb4b7] lg:block">GUANGYU AI WORKSPACE</div>
        </div>
        <div className="flex min-w-0 flex-col px-4 py-3 sm:px-6 sm:py-5">
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
            placeholder={mode === "chat" ? "描述你的目标、已有资料或期望结果…" : "输入问题，搜索知识库中的相关片段…"}
            aria-label="向 AI 助手提问"
            className="min-h-[96px] w-full flex-1 resize-none rounded-xl border border-[#e4d9d5] bg-[#fcfaf8] px-4 py-3 text-[14px] leading-6 text-title outline-none transition-colors placeholder:text-[#a08d85] focus:border-[#ad5964] focus:bg-white focus:ring-4 focus:ring-[#f6eae6] sm:min-h-[114px]"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 flex-wrap gap-2">
              <div role="group" aria-label="助手功能" className="inline-flex rounded-lg border border-[#e8dcda] bg-[#f7f0ec] p-0.5">
                {(["chat", "search"] as const).map((item) => <button key={item} type="button" aria-pressed={mode === item} disabled={sending} onClick={() => onModeChange(item)} className={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${mode === item ? "bg-white text-[#8b293a] shadow-sm" : "text-[#9a847d] hover:text-[#8b293a]"}`}>{item === "chat" ? "问答" : "搜索"}</button>)}
              </div>
              {mode === "search" ? <select aria-label="选择知识库" value={knowledgeId} onChange={(event) => onKnowledgeChange(event.target.value)} className="h-8 min-w-0 max-w-[220px] rounded-lg border border-[#e8dcda] bg-white px-2 text-xs text-[#836c69]"><option value="">请选择知识库</option>{knowledgeOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select> : null}
            </div>
            <button type="button" disabled={sending} onClick={() => void handleSend()} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#922c3b] px-4 text-[13px] font-medium text-white shadow-[0_7px_16px_rgba(117,32,49,0.18)] transition-colors hover:bg-[#70202e] disabled:cursor-not-allowed disabled:bg-[#c99499]">
              {sending ? "处理中" : mode === "chat" ? "开始对话" : "搜索"}<ArrowUp size={15} />
            </button>
          </div>
          {error ? <p role="alert" className="mt-2 text-xs text-rose-600">{error}</p> : null}
        </div>
      </div>
    </section>
  );
}
