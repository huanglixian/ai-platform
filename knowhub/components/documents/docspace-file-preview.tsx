import { Badge } from "@/components/ui/badge";
import { DocspaceEmptyState } from "@/knowhub/components/documents/docspace-empty-state";
import type { DocSpaceRecord } from "@/knowhub/types";

type DocspaceFilePreviewProps = {
  item: DocSpaceRecord | null;
};

const sourceLabelMap = {
  manual: "直接新建",
  ftp: "FTP 接入",
  oss: "OSS 接入",
} as const;

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
    <div className="rounded-[14px] border border-[#dbe5f0] bg-white px-5 py-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="flex flex-col gap-3 border-b border-[#eef2f6] pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <div className="text-title text-[18px] font-semibold">{item.name}</div>
          <div className="text-[13px] leading-6 text-[#667085]">{item.summary}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{sourceLabelMap[item.sourceType]}</Badge>
          <Badge variant="outline">{item.connectedTarget}</Badge>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[12px] bg-[#f7fafd] px-3.5 py-3">
          <div className="text-[11px] text-[#98a2b3]">文档数量</div>
          <div className="mt-1 text-title text-[18px] font-semibold">
            {item.documentCount}
          </div>
        </div>
        <div className="rounded-[12px] bg-[#f7fafd] px-3.5 py-3">
          <div className="text-[11px] text-[#98a2b3]">知识库数量</div>
          <div className="mt-1 text-title text-[18px] font-semibold">
            {item.knowledgeCount}
          </div>
        </div>
        <div className="rounded-[12px] bg-[#f7fafd] px-3.5 py-3">
          <div className="text-[11px] text-[#98a2b3]">最近同步</div>
          <div className="mt-1 text-title text-[18px] font-semibold">
            {item.lastSyncAt}
          </div>
        </div>
      </div>
      <div className="mt-5 space-y-2">
        <div className="text-title text-[13px] font-semibold">来源文件现状</div>
        <div className="overflow-x-auto rounded-[12px] border border-[#eef2f6] bg-[#fbfcfd]">
          <div className="grid grid-cols-[1.3fr_1.2fr_90px_120px_90px] gap-3 border-b border-[#eef2f6] px-4 py-3 text-[11px] font-medium text-[#98a2b3]">
            <div>文件名</div>
            <div>路径</div>
            <div>大小</div>
            <div>更新时间</div>
            <div>状态</div>
          </div>
          <div className="divide-y divide-[#eef2f6]">
            {item.files.map((file) => (
              <div
                key={file.id}
                className="grid grid-cols-[1.3fr_1.2fr_90px_120px_90px] gap-3 px-4 py-3 text-[12px]"
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
    </div>
  );
}
