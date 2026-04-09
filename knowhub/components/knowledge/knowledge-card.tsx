import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { PipelineRecord } from "@/knowhub/features/knowledge/types";

type KnowledgeCardProps = {
  item: PipelineRecord;
  docspaceSummaries: string[];
  href?: string;
};

const statusMap = {
  draft: {
    label: "草稿",
    badgeClassName: "border-[#d8e1eb] bg-white text-[#667085]",
    lineColor: "#98a2b3",
  },
  published: {
    label: "已发布",
    badgeClassName: "border-[#c9dcf2] bg-[#edf5fd] text-[#1a4d87]",
    lineColor: "#4a83c5",
  },
  running: {
    label: "运行中",
    badgeClassName: "border-[#efd5a8] bg-[#fff5e7] text-[#9b6630]",
    lineColor: "#d08a33",
  },
  failed: {
    label: "失败",
    badgeClassName: "border-[#f0d2d2] bg-[#fff5f5] text-[#a33a3a]",
    lineColor: "#c94848",
  },
} as const;

export function KnowledgeCard({
  item,
  docspaceSummaries,
  href,
}: KnowledgeCardProps) {
  const status = statusMap[item.status];
  const docspaceLabel = docspaceSummaries.join("、") || "未绑定";
  const containerClassName =
    "block h-full overflow-hidden rounded-[16px] border border-[#d8e1eb] bg-white text-left shadow-[0_8px_22px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-0.5 hover:border-[#bfd0e2] hover:shadow-[0_12px_26px_rgba(15,23,42,0.07)]";
  const content = (
    <div className="flex min-h-[220px] flex-col px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-title text-[16px] font-semibold tracking-[-0.02em]">
            {item.name}
          </div>
          <div className="mt-3 line-clamp-2 text-[12px] text-[#7b8798]">
            所属空间：{docspaceLabel}
          </div>
          <div className="mt-1 text-[12px] text-[#7b8798]">
            Embedding：{item.embeddingModel}
          </div>
        </div>
        <Badge className={status.badgeClassName} variant="outline">
          {status.label}
        </Badge>
      </div>

      <div className="mt-3 flex items-center rounded-[12px] border border-[#e9eff5] bg-white px-3.5 py-2.5 text-[12px] text-[#5f6f82]">
        <div className="flex min-w-0 flex-1 items-baseline justify-center gap-1.5">
          <span className="text-[#98a2b3]">文件数</span>
          <span className="text-title font-medium">{item.fileCount}</span>
        </div>
        <div className="mx-3 h-4 w-px shrink-0 bg-[#dbe5ef]" />
        <div className="flex min-w-0 flex-1 items-baseline justify-center gap-1.5">
          <span className="text-[#98a2b3]">切片数</span>
          <span className="text-title font-medium">{item.chunkCount}</span>
        </div>
      </div>

      <div className="mt-auto pt-3 text-[11px] text-[#7b8798]">
        <span className="shrink-0">最近运行：</span>
        <span className="text-title/80">{item.lastRunAt}</span>
      </div>
      <div
        className="mt-3 h-1 w-full rounded-full"
        style={{
          background: `linear-gradient(90deg, ${status.lineColor} 0%, color-mix(in srgb, ${status.lineColor} 58%, white) 100%)`,
        }}
      />
    </div>
  );

  if (!href) {
    return <div className={containerClassName}>{content}</div>;
  }

  return (
    <Link href={href} className={containerClassName}>
      {content}
    </Link>
  );
}
