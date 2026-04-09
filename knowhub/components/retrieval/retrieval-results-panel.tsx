import type { RetrievalSearchItem } from "@/knowhub/features/retrieval/types";

type RetrievalResultsPanelProps = {
  visible: boolean;
  items: RetrievalSearchItem[];
};

export function RetrievalResultsPanel({
  visible,
  items,
}: RetrievalResultsPanelProps) {
  if (!visible) {
    return null;
  }

  if (!items.length) {
    return (
      <div className="rounded-[16px] border border-dashed border-[#d6e0eb] bg-[#fafcff] px-4 py-10 text-[13px] text-[#667085]">
        暂无命中结果，请调整问题或确认知识库已完成建库。
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <section
          key={`${item.filePath}:${item.startLine}:${item.endLine}:${index}`}
          className="rounded-[16px] border border-[#d8e1eb] bg-white px-4 py-4 shadow-[0_8px_22px_rgba(15,23,42,0.04)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-title text-[14px] font-semibold">
                {item.fileName}
              </div>
              <div className="mt-1 truncate text-[12px] text-[#7b8798]">
                {item.filePath}
              </div>
            </div>
            <div className="shrink-0 rounded-full border border-[#dbe5ef] bg-[#f8fbfe] px-2.5 py-1 text-[11px] text-[#5f6f82]">
              相似度 {item.score}
            </div>
          </div>

          <div className="mt-3 text-[12px] text-[#667085]">
            {item.parentHeadings.length || item.headingTitle ? (
              <div className="truncate">
                标题链：
                {[...item.parentHeadings.map((heading) => heading.title), item.headingTitle]
                  .filter(Boolean)
                  .join(" / ")}
              </div>
            ) : null}
            <div className="mt-1">
              行号：{item.startLine}-{item.endLine}
            </div>
          </div>

          <div className="mt-3 rounded-[12px] border border-[#ebf1f6] bg-[#fbfdff] px-3 py-3 text-[13px] leading-6 text-title">
            {item.content}
          </div>
        </section>
      ))}
    </div>
  );
}
