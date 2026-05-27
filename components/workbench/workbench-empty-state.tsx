"use client";

import { useState } from "react";

type WorkbenchMode = "search" | "chat";

type WorkbenchEmptyStateProps = {
  mode: WorkbenchMode;
  knowledgeId: string;
  knowledgeOptions: Array<{
    id: string;
    name: string;
  }>;
  sending: boolean;
  status: string;
  initialValue?: string;
  resetKey?: string;
  onModeChange: (mode: WorkbenchMode) => void;
  onKnowledgeChange: (knowledgeId: string) => void;
  onSend: (value: string) => void | Promise<void>;
};

export function WorkbenchEmptyState({
  initialValue = "",
  resetKey = "",
  ...props
}: WorkbenchEmptyStateProps) {
  const emptyStateKey = `${resetKey}:${initialValue}`;

  return (
    <WorkbenchEmptyStateContent
      key={emptyStateKey}
      initialValue={initialValue}
      {...props}
    />
  );
}

function WorkbenchEmptyStateContent({
  mode,
  knowledgeId,
  knowledgeOptions,
  sending,
  status,
  initialValue = "",
  onModeChange,
  onKnowledgeChange,
  onSend,
}: WorkbenchEmptyStateProps) {
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
            placeholder={
              mode === "chat"
                ? "输入需求，后续将推荐匹配的工作流、技能、工具和业务 API"
                : "输入问题，搜索知识库中的相关片段"
            }
            className="min-h-[132px] w-full resize-none border-0 bg-transparent px-1 py-1 text-[16px] leading-8 text-title outline-none placeholder:text-[#98a2b3]"
          />
          <div className="mt-4 flex items-center justify-between gap-4 border-t border-[#eef2f6] pt-4">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex items-center gap-1 rounded-[10px] border border-[#dbe5f0] bg-[#f8fbfe] px-1 py-1">
                <button
                  type="button"
                  onClick={() => onModeChange("chat")}
                  className={[
                    "rounded-[7px] px-3 py-1.5 text-[13px] transition-colors",
                    mode === "chat"
                      ? "bg-white text-[#1a4d87]"
                      : "text-[#667085] hover:bg-white/70",
                  ].join(" ")}
                >
                  问答
                </button>
                <button
                  type="button"
                  onClick={() => onModeChange("search")}
                  className={[
                    "rounded-[7px] px-3 py-1.5 text-[13px] transition-colors",
                    mode === "search"
                      ? "bg-white text-[#1a4d87]"
                      : "text-[#667085] hover:bg-white/70",
                  ].join(" ")}
                >
                  搜索
                </button>
              </div>

              {mode === "search" ? (
                <select
                  value={knowledgeId}
                  onChange={(event) => onKnowledgeChange(event.target.value)}
                  className="h-[34px] w-[240px] rounded-[10px] border border-[#dbe5f0] bg-white px-3 text-[12px] text-title outline-none transition-colors focus:border-[#6f96c4]"
                >
                  <option value="">请选择知识库</option>
                  {knowledgeOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="min-w-0 truncate text-[12px] text-[#7f8ea3]">
                  {status
                    ? `处理中：${status}`
                    : sending
                      ? "正在处理..."
                      : "能力推荐待接入，当前不会调用旧服务"}
                </div>
              )}
            </div>
            <button
              type="button"
              disabled={sending}
              onClick={() => void handleSend()}
              className="h-[42px] rounded-[12px] bg-[#0368b3] px-5 text-[14px] font-medium text-white transition-colors hover:bg-[#1a4d87] disabled:cursor-not-allowed disabled:bg-[#7eaed6]"
            >
              {sending ? "处理中..." : mode === "chat" ? "发送" : "搜索"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
