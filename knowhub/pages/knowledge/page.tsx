 "use client";

import { useState } from "react";

import { KnowledgeCard } from "@/knowhub/components/knowledge/knowledge-card";
import { KnowHubPageShell } from "@/knowhub/components/layout/knowhub-page-shell";
import { KnowHubCardGrid } from "@/knowhub/components/shared/card-grid";
import { KnowHubPageToolbar } from "@/knowhub/components/shared/page-toolbar";
import { pipelineRecords } from "@/knowhub/data/pipelines";
import { docSpaceRecords } from "@/knowhub/data/docspaces";

const statusTabs = [
  { key: "all", label: "全部" },
  { key: "draft", label: "草稿" },
  { key: "published", label: "已发布" },
  { key: "running", label: "运行中" },
] as const;

export function KnowHubKnowledgePage() {
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<(typeof statusTabs)[number]["key"]>("all");

  const normalizedKeyword = keyword.trim().toLowerCase();
  const visiblePipelines = pipelineRecords.filter((item) => {
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesKeyword =
      !normalizedKeyword ||
      item.name.toLowerCase().includes(normalizedKeyword) ||
      item.summary.toLowerCase().includes(normalizedKeyword) ||
      item.knowledgeTarget.toLowerCase().includes(normalizedKeyword) ||
      item.targetLabel.toLowerCase().includes(normalizedKeyword);

    return matchesStatus && matchesKeyword;
  });

  return (
    <KnowHubPageShell>
      <KnowHubPageToolbar
        searchValue={keyword}
        onSearchChange={setKeyword}
        searchPlaceholder="搜索任务名称、对象或输出知识库"
        tabs={statusTabs}
        activeTab={statusFilter}
        onTabChange={setStatusFilter}
        actionLabel="新建任务"
        onAction={() => {}}
      />

      <section className="rounded-[20px] border border-[#dde6f0] bg-[linear-gradient(180deg,rgba(236,241,247,0.92)_0%,rgba(244,247,251,0.96)_100%)] px-3 py-3 sm:px-4 sm:py-4">
        <KnowHubCardGrid itemWidth={325}>
          {visiblePipelines.map((item) => {
            const docspaceNames = docSpaceRecords
              .filter((record) => item.docspaceIds.includes(record.id))
              .map((record) => record.name);

            return (
              <KnowledgeCard
                key={item.id}
                item={item}
                docspaceNames={docspaceNames}
              />
            );
          })}
        </KnowHubCardGrid>
      </section>
    </KnowHubPageShell>
  );
}
