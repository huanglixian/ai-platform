import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { KnowledgeFlowBar } from "@/knowhub/components/knowledge/knowledge-flow-bar";
import { KnowledgeStepCard } from "@/knowhub/components/knowledge/knowledge-step-card";
import { KnowHubPageShell } from "@/knowhub/components/layout/knowhub-page-shell";
import { docSpaceRecords } from "@/knowhub/features/docspaces/data";
import { pipelineRecords } from "@/knowhub/features/knowledge/data";
import { strategyRecords } from "@/knowhub/features/strategies/data";
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
}: KnowHubKnowledgeDetailPageProps) {
  const item = pipelineRecords.find((record) => record.id === id);

  if (!item) {
    notFound();
  }

  const docspaces = docSpaceRecords.filter((record) => item.docspaceIds.includes(record.id));
  const status = statusMap[item.status];

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
            <div className="text-[11px] text-[#98a2b3]">关联 DocSpace</div>
            <div className="mt-1 text-[12px] leading-5 text-title">
              {docspaces.map((record) => record.name).join("、")}
            </div>
          </div>
          <div className="rounded-[12px] border border-[#dde6f0] bg-[linear-gradient(180deg,rgba(236,242,248,0.78)_0%,rgba(247,250,253,0.92)_100%)] px-3 py-2">
            <div className="text-[11px] text-[#98a2b3]">处理对象</div>
            <div className="mt-1 text-[12px] leading-5 text-title">{item.targetLabel}</div>
          </div>
          <div className="rounded-[12px] border border-[#dde6f0] bg-[linear-gradient(180deg,rgba(236,242,248,0.78)_0%,rgba(247,250,253,0.92)_100%)] px-3 py-2">
            <div className="text-[11px] text-[#98a2b3]">Embedding</div>
            <div className="mt-1 text-[12px] leading-5 text-title">{item.embeddingModel}</div>
          </div>
          <div className="rounded-[12px] border border-[#dde6f0] bg-[linear-gradient(180deg,rgba(236,242,248,0.78)_0%,rgba(247,250,253,0.92)_100%)] px-3 py-2">
            <div className="text-[11px] text-[#98a2b3]">输出知识库</div>
            <div className="mt-1 text-[12px] leading-5 text-title">{item.knowledgeTarget}</div>
          </div>
        </div>
      </section>

      <KnowledgeFlowBar
        items={[
          { key: "target", label: "目标对象", value: `${docspaces.length} 个空间` },
          {
            key: "preprocess",
            label: "预处理",
            value: `${item.preprocessStrategyIds.length} 个策略`,
          },
          {
            key: "chunking",
            label: "切片",
            value: `${item.chunkingStrategyIds.length} 个策略`,
          },
          {
            key: "extract",
            label: "提取",
            value: `${item.extractStrategyIds.length} 个策略`,
          },
          { key: "embedding", label: "向量化", value: item.embeddingModel },
          { key: "knowledge", label: "知识库", value: item.knowledgeTarget },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <KnowledgeStepCard
          title="目标对象"
          description="先确定当前处理任务作用在哪些空间、文件夹或文件类型上。"
        >
          <div className="space-y-2">
            {docspaces.map((record) => (
              <div
                key={record.id}
                className="rounded-[12px] border border-[#e7edf4] bg-[#f8fbfe] px-3 py-2.5"
              >
                <div className="text-title text-[13px] font-medium">{record.name}</div>
                <div className="mt-1 text-[12px] leading-5 text-[#667085]">
                  {record.summary}
                </div>
              </div>
            ))}
            <div className="rounded-[12px] border border-[#e7edf4] bg-white px-3 py-2.5 text-[12px] text-[#5f6f82]">
              处理范围：<span className="text-title font-medium">{item.targetLabel}</span>
            </div>
          </div>
        </KnowledgeStepCard>

        <KnowledgeStepCard
          title="预处理策略"
          description="针对不同文档格式先做转写、清洗、规整，为后续切片和提取打底。"
        >
          {renderStrategyList(item.preprocessStrategyIds)}
        </KnowledgeStepCard>

        <KnowledgeStepCard
          title="切片策略"
          description="基于文档结构、表格和正文内容选择合适的切片方式。"
        >
          {renderStrategyList(item.chunkingStrategyIds)}
        </KnowledgeStepCard>

        <KnowledgeStepCard
          title="提取策略"
          description="对表格字段、要点摘要或实体关系做进一步提取，补强知识结构。"
        >
          {renderStrategyList(item.extractStrategyIds)}
        </KnowledgeStepCard>

        <KnowledgeStepCard
          title="向量化"
          description="将切片后的内容送入 embedding 模型，生成可检索的向量索引。"
        >
          <div className="rounded-[12px] border border-[#e7edf4] bg-[#f8fbfe] px-3 py-2.5 text-[12px] text-[#5f6f82]">
            当前模型：<span className="text-title font-medium">{item.embeddingModel}</span>
          </div>
        </KnowledgeStepCard>

        <KnowledgeStepCard
          title="知识库输出"
          description="处理完成后写入目标知识库，并作为后续检索与问答的数据来源。"
        >
          <div className="rounded-[12px] border border-[#e7edf4] bg-[#f8fbfe] px-3 py-2.5 text-[12px] text-[#5f6f82]">
            输出目标：<span className="text-title font-medium">{item.knowledgeTarget}</span>
          </div>
          <div className="mt-2 rounded-[12px] border border-[#e7edf4] bg-white px-3 py-2.5 text-[12px] text-[#5f6f82]">
            最近运行：<span className="text-title font-medium">{item.lastRunAt}</span>
            <span className="ml-4">
              执行次数：<span className="text-title font-medium">{item.runCount}</span>
            </span>
          </div>
        </KnowledgeStepCard>
      </div>
    </KnowHubPageShell>
  );
}
