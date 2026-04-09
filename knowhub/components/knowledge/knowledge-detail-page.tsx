import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { KnowHubPageShell } from "@/knowhub/components/layout/knowhub-page-shell";
import { KnowledgeRunButton } from "@/knowhub/components/knowledge/knowledge-run-button";
import { strategyRecords } from "@/knowhub/features/strategies/data";
import type {
  KnowledgeRunRecord,
  PipelineRecord,
} from "@/knowhub/features/knowledge/types";
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
  failed: {
    label: "失败",
    className: "border-[#f0d2d2] bg-[#fff5f5] text-[#a33a3a]",
  },
} as const;

const runStatusLabelMap = {
  running: "建库进行中",
  succeeded: "建库完成",
  failed: "建库失败",
} as const;

type KnowHubKnowledgeDetailPageProps = {
  item: PipelineRecord | null;
  runs: KnowledgeRunRecord[];
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

function formatDateTime(value: string | null) {
  if (!value) {
    return "暂无";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(date)
    .replace(/\//g, "-");
}

export function KnowHubKnowledgeDetailPage({
  item,
  runs,
  docspaceItems,
}: KnowHubKnowledgeDetailPageProps) {
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
          <div className="flex flex-col items-end gap-2">
            <KnowledgeRunButton knowledgeId={item.id} />
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
            <div className="mt-1 text-[12px] leading-5 text-title">{item.fileCount || fileCount}</div>
          </div>
          <div className="rounded-[12px] border border-[#dde6f0] bg-[linear-gradient(180deg,rgba(236,242,248,0.78)_0%,rgba(247,250,253,0.92)_100%)] px-3 py-2">
            <div className="text-[11px] text-[#98a2b3]">切片数</div>
            <div className="mt-1 text-[12px] leading-5 text-title">{item.chunkCount}</div>
          </div>
        </div>

        {item.lastError ? (
          <div className="mt-3 rounded-[12px] border border-[#f0d2d2] bg-[#fff8f8] px-3 py-2 text-[12px] text-[#a33a3a]">
            最近错误：{item.lastError}
          </div>
        ) : null}
      </section>

      <div className="grid gap-4 xl:grid-cols-4">
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

        <section className="rounded-[16px] border border-[#d8e1eb] bg-white px-4 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <div className="mb-3 text-title text-[16px] font-semibold tracking-[-0.02em]">
            运行记录
          </div>
          <div className="space-y-2">
            {runs.length ? (
              runs.map((run) => (
                <div
                  key={run.id}
                  className="rounded-[12px] border border-[#e7edf4] bg-[#f8fbfe] px-3 py-2.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-title text-[13px] font-medium">
                      {runStatusLabelMap[run.status]}
                    </div>
                    <div className="text-[11px] text-[#98a2b3]">{run.status}</div>
                  </div>
                  {run.status === "failed" && run.message ? (
                    <div className="mt-2 break-words text-[11px] leading-5 text-[#667085]">
                      错误：{run.message}
                    </div>
                  ) : null}
                  <div className="mt-2 text-[11px] leading-5 text-[#667085]">
                    文件 {run.fileCount} / 切片 {run.chunkCount} / 向量 {run.vectorCount}
                  </div>
                  <div className="mt-1 text-[11px] text-[#7b8798]">
                    开始：{formatDateTime(run.startedAt)}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[12px] border border-dashed border-[#d6e0eb] bg-[#fafcff] px-3 py-6 text-[12px] text-[#667085]">
                暂无运行记录
              </div>
            )}
          </div>
        </section>
      </div>
    </KnowHubPageShell>
  );
}
