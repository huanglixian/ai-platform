"use client";

import type { ReactNode } from "react";
import type { FileTreeNode } from "@/app/appfactory/_lib/project-ui";

export type WorkspaceEvent = { type: string; content: string };

export const workspaceEventLabel: Record<string, string> = {
  user: "你",
  text: "AI 回复",
  tool: "工具调用",
  error: "错误",
  completed: "已完成",
  check: "检查",
  build: "构建",
  preview: "预览",
  deploy: "本地发布",
};

export function ProjectFileTree({
  nodes,
  selected,
  onSelect,
}: {
  nodes: FileTreeNode[];
  selected: string;
  onSelect: (path: string) => void;
}) {
  const render = (items: FileTreeNode[], level = 0): ReactNode =>
    items.map((node) =>
      node.type === "folder" ? (
        <div key={node.path} className="mt-2">
          <div
            className="flex items-center gap-1 px-2 text-[11px] font-medium text-[#667085]"
            style={{ paddingLeft: `${level * 12 + 8}px` }}
          >
            <span className="text-[#98a2b3]">⌄</span>
            <span>{node.name}</span>
            {node.changed && (
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#2e7dd2]" />
            )}
          </div>
          {render(node.children ?? [], level + 1)}
        </div>
      ) : (
        <button
          key={node.path}
          type="button"
          onClick={() => onSelect(node.path)}
          className={`flex w-full items-center gap-1.5 rounded-md py-1.5 pr-2 text-left text-[11px] transition ${selected === node.path ? "bg-[#eef5fd] font-medium text-[#0368b3]" : "text-[#667085] hover:bg-[#f6f8fb]"}`}
          style={{ paddingLeft: `${level * 12 + 20}px` }}
        >
          <span className="text-[9px] text-[#98a2b3]">□</span>
          <span className="truncate">{node.name}</span>
          {node.changed && (
            <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-[#2e7dd2]" />
          )}
        </button>
      ),
    );
  return <>{render(nodes)}</>;
}

export function ChatPanel({
  events,
  busy,
  prompt,
  sessionReady,
  model,
  className,
  onPromptChange,
  onSend,
  onStop,
}: {
  events: WorkspaceEvent[];
  busy: boolean;
  prompt: string;
  sessionReady: boolean;
  model: string;
  className?: string;
  onPromptChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
}) {
  return (
    <section className={`${className ?? ""} min-w-0 flex-1 flex-col bg-white`}>
      <div className="min-h-0 flex-1 overflow-auto px-4 py-5 sm:px-7 lg:px-10">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-[#eef5fd] text-[#0368b3]">
              ✦
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1a4d87]">
                AI 开发助手
              </p>
              <p className="mt-1 text-[11px] text-[#98a2b3]">
                {busy
                  ? "正在处理你的需求…"
                  : "描述目标，AI 会在当前 Workspace 中完成修改。"}
              </p>
            </div>
          </div>
          {events.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#d4dde8] bg-[#f6f8fb] p-8 text-sm leading-7 text-[#667085]">
              你可以从一句自然语言开始，例如：
              <br />
              <span className="font-medium text-[#1a4d87]">
                “创建一个设备巡检看板，包含状态筛选和趋势图。”
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event, index) => (
                <div
                  key={`${event.type}-${index}`}
                  className={`${event.type === "user" ? "ml-8 bg-[#eef5fd] text-[#1a4d87]" : "mr-8 border border-[#edf1f5] bg-white text-[#4d4d4d]"} rounded-xl px-4 py-3 text-sm leading-6 shadow-[0_2px_6px_rgba(15,23,42,.03)]`}
                >
                  <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6f96c4]">
                    {workspaceEventLabel[event.type] || event.type}
                  </div>
                  <pre className="whitespace-pre-wrap font-sans">
                    {event.content}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="border-t border-[#edf1f5] bg-white px-4 py-3 sm:px-7 lg:px-10">
        <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-xl border border-[#cfd8e3] bg-white p-2 shadow-[0_4px_14px_rgba(15,23,42,.06)] focus-within:border-[#6f96c4]">
          <textarea
            value={prompt}
            onChange={(event) => onPromptChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                onSend();
              }
            }}
            placeholder="告诉我你想创建、修改或优化什么…"
            className="min-h-11 min-w-0 flex-1 resize-none border-0 px-2 py-2 text-sm text-[#262626] outline-none placeholder:text-[#98a2b3]"
            disabled={!sessionReady || busy}
          />
          <button
            type="button"
            onClick={busy ? onStop : onSend}
            disabled={!sessionReady || (!busy && !prompt.trim())}
            className={`h-9 shrink-0 rounded-lg px-4 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 ${busy ? "bg-[#b9382f]" : "bg-[#0368b3] hover:bg-[#1a4d87]"}`}
          >
            {busy ? "停止" : "发送"}
          </button>
        </div>
        <p className="mx-auto mt-2 max-w-3xl text-[10px] text-[#98a2b3]">
          Enter 发送 · Shift + Enter 换行 · {model}
        </p>
      </div>
    </section>
  );
}

export function FileViewer({
  path,
  changed,
  mode,
  content,
  diff,
  onModeChange,
  onClose,
  onDiscuss,
}: {
  path: string;
  changed: boolean;
  mode: "diff" | "content";
  content: string;
  diff: string;
  onModeChange: (mode: "diff" | "content") => void;
  onClose: () => void;
  onDiscuss: () => void;
}) {
  return (
    <section className="order-2 flex min-w-0 flex-1 flex-col border-r border-[#d4dde8] bg-[#f8fafc] sm:w-[46%] lg:w-[44%]">
      <div className="flex min-h-14 items-center justify-between gap-3 border-b border-[#d4dde8] bg-white px-4">
        <div className="min-w-0">
          <p className="truncate font-mono text-xs font-medium text-[#1a4d87]">
            {path}
          </p>
          <p className="mt-1 text-[10px] text-[#98a2b3]">
            {changed ? "已修改 · 相对初始快照有变更" : "当前 Workspace 内容"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onModeChange("diff")}
            className={`rounded-md px-2 py-1 text-[10px] ${mode === "diff" ? "bg-[#eef5fd] font-medium text-[#0368b3]" : "text-[#98a2b3]"}`}
          >
            变更
          </button>
          <button
            type="button"
            onClick={() => onModeChange("content")}
            className={`rounded-md px-2 py-1 text-[10px] ${mode === "content" ? "bg-[#eef5fd] font-medium text-[#0368b3]" : "text-[#98a2b3]"}`}
          >
            内容
          </button>
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(path)}
            className="rounded-md px-2 py-1 text-[10px] text-[#667085] hover:text-[#0368b3]"
          >
            复制
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭文件查看器"
            className="rounded-md px-2 py-1 text-base text-[#98a2b3] hover:text-[#4d4d4d]"
          >
            ×
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto bg-[#0f2032] p-4">
        <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-5 text-[#dbe8f5]">
          {mode === "diff" && diff ? diff : content || "暂无内容"}
        </pre>
      </div>
      <div className="flex items-center justify-between border-t border-[#d4dde8] bg-white px-4 py-3">
        <span className="text-[10px] text-[#98a2b3]">
          单文件查看 · 不影响当前对话
        </span>
        <button
          type="button"
          onClick={onDiscuss}
          className="text-[10px] font-medium text-[#0368b3] hover:underline"
        >
          在对话中讨论此文件
        </button>
      </div>
    </section>
  );
}
