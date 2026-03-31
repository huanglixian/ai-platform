import { DocspaceEmptyState } from "@/knowhub/components/documents/docspace-empty-state";
import type { DocSpaceRecord } from "@/knowhub/types";

type DocspaceFilePreviewProps = {
  item: DocSpaceRecord | null;
};

export function DocspaceFilePreview({ item }: DocspaceFilePreviewProps) {
  if (!item) {
    return (
      <DocspaceEmptyState
        title="暂无可展示的 DocSpace"
        description="当前筛选条件下没有匹配的空间，请调整关键词或切换来源类型。"
      />
    );
  }

  if (item.sourceType === "manual" && item.files.length === 0) {
    return (
      <DocspaceEmptyState
        title={`${item.name} 还是空空间`}
        description="这个 DocSpace 已创建完成，但还没有接入文档来源。后续可以手工整理内容，或再补接 FTP / OSS。"
      />
    );
  }

  return (
    <section className="rounded-[14px] border border-[#d8e1eb] bg-[linear-gradient(180deg,rgba(249,251,253,0.98)_0%,rgba(255,255,255,0.98)_100%)] px-5 py-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="space-y-2">
        <div className="text-title text-[15px] font-semibold">文件列表</div>
        <div className="overflow-x-auto rounded-[12px] border border-[#e2eaf2] bg-[rgba(255,255,255,0.88)]">
          <div className="grid grid-cols-[1.3fr_1.2fr_90px_120px_90px] gap-3 border-b border-[#e2eaf2] bg-[linear-gradient(180deg,rgba(237,242,248,0.88)_0%,rgba(245,248,251,0.88)_100%)] px-4 py-3 text-[11px] font-medium text-[#8d98a8]">
            <div>文件名</div>
            <div>路径</div>
            <div>大小</div>
            <div>更新时间</div>
            <div>状态</div>
          </div>
          <div className="divide-y divide-[#e7edf4]">
            {item.files.map((file) => (
              <div
                key={file.id}
                className="grid grid-cols-[1.3fr_1.2fr_90px_120px_90px] gap-3 bg-[rgba(255,255,255,0.84)] px-4 py-3 text-[12px]"
              >
                <div className="truncate text-title font-medium">{file.name}</div>
                <div className="truncate text-[#667085]">{file.path}</div>
                <div className="text-[#667085]">{file.sizeLabel}</div>
                <div className="text-[#667085]">{file.updatedAt}</div>
                <div className="text-[#1a4d87]">{file.statusLabel}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
