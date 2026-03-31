"use client";

import { useState } from "react";

import { KnowHubPageShell } from "@/knowhub/components/layout/knowhub-page-shell";
import { DocspaceCard } from "@/knowhub/components/documents/docspace-card";
import { DocspaceCreateDialog } from "@/knowhub/components/documents/docspace-create-dialog";
import { KnowHubCardGrid } from "@/knowhub/components/shared/card-grid";
import { KnowHubPageToolbar } from "@/knowhub/components/shared/page-toolbar";
import { docSpaceRecords } from "@/knowhub/data/docspaces";

const sourceTabs = [
  { key: "all", label: "全部" },
  { key: "manual", label: "直接新建" },
  { key: "ftp", label: "FTP" },
  { key: "oss", label: "OSS" },
] as const;

export function KnowHubDocumentsPage() {
  const [keyword, setKeyword] = useState("");
  const [sourceFilter, setSourceFilter] =
    useState<(typeof sourceTabs)[number]["key"]>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const normalizedKeyword = keyword.trim().toLowerCase();
  const filteredDocSpaces = docSpaceRecords.filter((item) => {
    const matchesKeyword =
      !normalizedKeyword ||
      item.name.toLowerCase().includes(normalizedKeyword) ||
      item.summary.toLowerCase().includes(normalizedKeyword);
    const matchesSource =
      sourceFilter === "all" || item.sourceType === sourceFilter;

    return matchesKeyword && matchesSource;
  });

  return (
    <KnowHubPageShell>
      <KnowHubPageToolbar
        searchValue={keyword}
        onSearchChange={setKeyword}
        searchPlaceholder="搜索 DocSpace 名称或描述"
        tabs={sourceTabs}
        activeTab={sourceFilter}
        onTabChange={setSourceFilter}
        actionLabel="新建空间"
        onAction={() => setCreateDialogOpen(true)}
      />

      <section className="rounded-[20px] border border-[#dde6f0] bg-[linear-gradient(180deg,rgba(236,241,247,0.92)_0%,rgba(244,247,251,0.96)_100%)] px-3 py-3 sm:px-4 sm:py-4">
        <KnowHubCardGrid itemWidth={325}>
          {filteredDocSpaces.map((item) => (
            <DocspaceCard
              key={item.id}
              item={item}
            />
          ))}
        </KnowHubCardGrid>
      </section>

      <DocspaceCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </KnowHubPageShell>
  );
}
