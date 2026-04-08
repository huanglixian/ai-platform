import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { KnowHubPageShell } from "@/knowhub/components/layout/knowhub-page-shell";
import { pipelineRecords } from "@/knowhub/features/knowledge/data";
import { strategyRecords } from "@/knowhub/features/strategies/data";
import type { DocSpaceRecord } from "@/knowhub/features/docspace/types";
import { cn } from "@/lib/utils";

const statusMap = {
  draft: {
    label: "草稿",
    className: "border-[#d8e1eb] bg-white text-[#667085]",
  },
  published: {
    label: "已发布",
    className: "border-[#c9dcf2] bg-[#edf5fd] text-[#1a4d87]",
  },
  running: {
    label: "运行中",
    className: "border-[#efd5a8] bg-[#fff5e7] text-[#9b6630]",
  },
} as const;

type KnowHubKnowledgeDetailPageProps = {
  id: string;
  docspaceItems: DocSpaceRecord[];
};

function renderStrategyList(ids: string[]) {
  const items = strategyRecords.filter((item) => ids.includes(item.id));

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-[12px] border border-[#e7edf4] bg-[#f8fbfe] px-3 py-2.5"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="text-title text-[13px] font-medium">{item.name}</div>
            <div className="text-[11px] text-[#98a2b3]">{item.group}</div>
          </div>
          <div className="mt-1 text-[12px] leading-5 text-[#667085]">{item.summary}</div>
          <div className="mt-2 text-[11px] text-[#7b8798]">
            {item.metaLabel}：{item.metaValue}
          </div>
        </div>
      ))}
    </div>
  );
}

export function KnowHubKnowledgeDetailPage({
  id,
  docspaceItems,
}: KnowHubKnowledgeDetailPageProps) {
  const item = pipelineRecords.find((record) => record.id === id);

  if (!item) {
    notFound();
  }

  const matchedItems = docspaceItems.filter((record) =>
    item.docspaceIds.includes(record.id),
  );
  const status = statusMap[item.status];
  const fileCount = matchedItems.reduce(
    (sum, record) => sum + record.documentCount,
    0,
  );
  const chunkCount = Math.max(
    fileCount * Math.max(item.chunkingStrategyIds.length, 1) * 8,
    item.chunkingStrategyIds.length * 24,
  );

  return (
    <KnowHubPageShell>
      <section className="rounded-[16px] border border-[#d8e1eb] bg-[linear-gradient(180deg,rgba(244,247,251,0.98)_0%,rgba(255,255,255,0.98)_100%)] px-4.5 py-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-title text-[22px] font-semibold tracking-[-0.03em]">
                {item.name}
              </div>
              <Badge className={status.className} variant="outline">
                {status.label}
              </Badge>
            </div>
            <div className="mt-1 text-[13px] leading-6 text-[#667085]">
              {item.summary}
            </div>
          </div>
          <Link
            href="/knowhub/knowledge"
            className={cn(
              buttonVariants({ variant: "secondary", size: "sm" }),
              "h-8 shrink-0 px-3 text-[12px]"
            )}
          >
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            返回知识中心
          </Link>
        </div>

        <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[12px] border border-[#dde6f0] bg-[linear-gradient(180deg,rgba(236,242,248,0.78)_0%,rgba(247,250,253,0.92)_100%)] px-3 py-2">
            <div className="text-[11px] text-[#98a2b3]">关联文档空间</div>
            <div className="mt-1 text-[12px] leading-5 text-title">
              {matchedItems.map((record) => record.name).join("、")}
            </div>
          </div>
          <div className="rounded-[12px] border border-[#dde6f0] bg-[linear-gradient(180deg,rgba(236,242,248,0.78)_0%,rgba(247,250,253,0.92)_100%)] px-3 py-2">
            <div className="text-[11px] text-[#98a2b3]">Embedding</div>
            <div className="mt-1 text-[12px] leading-5 text-title">{item.embeddingModel}</div>
          </div>
          <div className="rounded-[12px] border border-[#dde6f0] bg-[linear-gradient(180deg,rgba(236,242,248,0.78)_0%,rgba(247,250,253,0.92)_100%)] px-3 py-2">
            <div className="text-[11px] text-[#98a2b3]">文件数</div>
            <div className="mt-1 text-[12px] leading-5 text-title">{fileCount}</div>
          </div>
          <div className="rounded-[12px] border border-[#dde6f0] bg-[linear-gradient(180deg,rgba(236,242,248,0.78)_0%,rgba(247,250,253,0.92)_100%)] px-3 py-2">
            <div className="text-[11px] text-[#98a2b3]">切片数</div>
            <div className="mt-1 text-[12px] leading-5 text-title">{chunkCount}</div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="rounded-[16px] border border-[#d8e1eb] bg-white px-4 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <div className="mb-3 text-title text-[16px] font-semibold tracking-[-0.02em]">
            预处理策略
          </div>
          {renderStrategyList(item.preprocessStrategyIds)}
        </section>

        <section className="rounded-[16px] border border-[#d8e1eb] bg-white px-4 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <div className="mb-3 text-title text-[16px] font-semibold tracking-[-0.02em]">
            切片策略
          </div>
          {renderStrategyList(item.chunkingStrategyIds)}
        </section>

        <section className="rounded-[16px] border border-[#d8e1eb] bg-white px-4 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <div className="mb-3 text-title text-[16px] font-semibold tracking-[-0.02em]">
            提取策略
          </div>
          {renderStrategyList(item.extractStrategyIds)}
        </section>
      </div>
    </KnowHubPageShell>
  );
}
