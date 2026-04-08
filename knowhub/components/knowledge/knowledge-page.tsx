"use client";

import { useMemo, useState } from "react";

import { KnowledgeCard } from "@/knowhub/components/knowledge/knowledge-card";
import { KnowledgeBuilderDialog } from "@/knowhub/components/knowledge/knowledge-builder-dialog";
import { KnowHubPageShell } from "@/knowhub/components/layout/knowhub-page-shell";
import { KnowHubCardGrid } from "@/knowhub/components/shared/card-grid";
import { KnowHubPageToolbar } from "@/knowhub/components/shared/page-toolbar";
import { pipelineRecords } from "@/knowhub/features/knowledge/data";
import type { PipelineRecord } from "@/knowhub/features/knowledge/types";
import type { DocSpaceRecord } from "@/knowhub/features/docspaces/types";

const statusTabs = [
  { key: "all", label: "全部" },
  { key: "draft", label: "草稿" },
  { key: "published", label: "已发布" },
  { key: "running", label: "运行中" },
] as const;

type KnowHubKnowledgePageProps = {
  docspaces: DocSpaceRecord[];
  initialBuilderOpen?: boolean;
  initialDocspaceId?: string;
};

export function KnowHubKnowledgePage({
  docspaces,
  initialBuilderOpen = false,
  initialDocspaceId,
}: KnowHubKnowledgePageProps) {
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<(typeof statusTabs)[number]["key"]>("all");
  const [builderOpen, setBuilderOpen] = useState(initialBuilderOpen);
  const [items, setItems] = useState<PipelineRecord[]>(pipelineRecords);

  const normalizedKeyword = keyword.trim().toLowerCase();
  const visiblePipelines = useMemo(() => items.filter((item) => {
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesKeyword =
      !normalizedKeyword ||
      item.name.toLowerCase().includes(normalizedKeyword) ||
      item.summary.toLowerCase().includes(normalizedKeyword) ||
      item.knowledgeTarget.toLowerCase().includes(normalizedKeyword) ||
      item.targetLabel.toLowerCase().includes(normalizedKeyword);

    return matchesStatus && matchesKeyword;
  }), [items, normalizedKeyword, statusFilter]);

  return (
    <KnowHubPageShell>
      <KnowHubPageToolbar
        searchValue={keyword}
        onSearchChange={setKeyword}
        searchPlaceholder="搜索知识库名称或对象"
        tabs={statusTabs}
        activeTab={statusFilter}
        onTabChange={setStatusFilter}
        actionLabel="新建知识库"
        onAction={() => setBuilderOpen(true)}
      />

      <section className="rounded-[20px] border border-[#dde6f0] bg-[linear-gradient(180deg,rgba(236,241,247,0.92)_0%,rgba(244,247,251,0.96)_100%)] px-3 py-3 sm:px-4 sm:py-4">
        <KnowHubCardGrid itemWidth={325}>
          {visiblePipelines.map((item) => {
            const docspaceNames = docspaces
              .filter((record) => item.docspaceIds.includes(record.id))
              .map((record) => record.name);

            return (
              <KnowledgeCard
                key={item.id}
                item={item}
                docspaceNames={docspaceNames}
                href={item.id.startsWith("draft_") ? undefined : `/knowhub/knowledge/${item.id}`}
              />
            );
          })}
        </KnowHubCardGrid>
      </section>

      <KnowledgeBuilderDialog
        open={builderOpen}
        docspaces={docspaces}
        initialDocspaceId={initialDocspaceId}
        onOpenChange={setBuilderOpen}
        onCreated={(item) => setItems((current) => [item, ...current])}
      />
    </KnowHubPageShell>
  );
}
