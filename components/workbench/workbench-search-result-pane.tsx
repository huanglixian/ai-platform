"use client";

import { MessageMarkdown } from "@/components/shared/message-markdown";
import type { WorkbenchSearchItem } from "@/features/workbench/api";

type WorkbenchSearchResultPaneProps = {
  searching: boolean;
  query: string;
  knowledgeName: string;
  hasSearched: boolean;
  error: string;
  items: WorkbenchSearchItem[];
};

export function WorkbenchSearchResultPane({
  searching,
  query,
  knowledgeName,
  hasSearched,
  error,
  items,
}: WorkbenchSearchResultPaneProps) {
  return (
    <section className="app-card-no-hover flex min-h-0 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#eef2f6] px-4 py-3">
        <div className="text-[15px] font-semibold text-title">搜索结果</div>
        <div className="truncate text-[12px] text-[#98a2b3]">
          {knowledgeName ? `知识库：${knowledgeName}` : "请选择知识库"}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {searching ? (
          <div className="rounded-[12px] border border-dashed border-[#d6e0eb] bg-[#fafbfd] px-4 py-10 text-center text-[13px] leading-6 text-[#7f8ea3]">
            正在检索相关片段...
          </div>
        ) : error ? (
          <div className="rounded-[12px] border border-[#f0d2d2] bg-[#fff8f8] px-4 py-3 text-[13px] leading-6 text-[#a33a3a]">
            {error}
          </div>
        ) : !hasSearched ? (
          <div className="rounded-[12px] border border-dashed border-[#d6e0eb] bg-[#fafbfd] px-4 py-10 text-center text-[13px] leading-6 text-[#7f8ea3]">
            选择知识库并输入问题后，这里会展示召回片段、标题链和文档索引。
          </div>
        ) : !items.length ? (
          <div className="rounded-[12px] border border-dashed border-[#d6e0eb] bg-[#fafbfd] px-4 py-10 text-center text-[13px] leading-6 text-[#7f8ea3]">
            未找到相关片段，请换个问题再试。
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-[12px] text-[#7f8ea3]">
              问题：{query}
            </div>

            {items.map((item, index) => (
              <article
                key={`${item.filePath}:${item.startLine}:${item.endLine}:${index}`}
                className="rounded-[12px] border border-[#e4edf6] bg-white px-4 py-3"
              >
                <div className="rounded-[10px] border border-[#edf2f7] bg-[#fafbfd] px-3 py-2.5">
                  <MessageMarkdown content={item.content} />
                </div>

                <div className="mt-3 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold text-title">
                      {item.fileName}
                    </div>
                    <div className="mt-1 truncate text-[11px] text-[#98a2b3]">
                      {item.filePath}
                    </div>
                    {item.parentHeadings.length || item.headingTitle ? (
                      <div className="mt-2 text-[11px] leading-5 text-[#667085]">
                        标题链：
                        {[...item.parentHeadings.map((heading) => heading.title), item.headingTitle]
                          .filter(Boolean)
                          .join(" / ")}
                      </div>
                    ) : null}
                    <div className="mt-1 text-[11px] text-[#7f8ea3]">
                      索引：{item.startLine}-{item.endLine}
                    </div>
                  </div>
                  <div className="shrink-0 rounded-full border border-[#dbe5f0] bg-[#f7fafc] px-2.5 py-1 text-[11px] text-[#51657d]">
                    {item.score}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
