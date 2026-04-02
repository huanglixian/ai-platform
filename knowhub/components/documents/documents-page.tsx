"use client";

import { useEffect, useState } from "react";

import { DocspaceCard } from "@/knowhub/components/documents/docspace-card";
import { DocspaceCreateDialog } from "@/knowhub/components/documents/docspace-create-dialog";
import { KnowHubPageShell } from "@/knowhub/components/layout/knowhub-page-shell";
import { KnowHubCardGrid } from "@/knowhub/components/shared/card-grid";
import { KnowHubPageToolbar } from "@/knowhub/components/shared/page-toolbar";
import { listDocSpacesApi } from "@/knowhub/features/docspaces/api";
import type { DocSpaceRecord } from "@/knowhub/features/docspaces/types";

const sourceTabs = [
  { key: "all", label: "全部" },
  { key: "hosted", label: "本地空间" },
  { key: "smb", label: "SMB" },
  { key: "oss", label: "OSS" },
] as const;

export function KnowHubDocumentsPage() {
  const [keyword, setKeyword] = useState("");
  const [items, setItems] = useState<DocSpaceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sourceFilter, setSourceFilter] =
    useState<(typeof sourceTabs)[number]["key"]>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  async function loadDocSpaces() {
    setLoading(true);
    setError("");

    try {
      const nextItems = await listDocSpacesApi();
      setItems(nextItems);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDocSpaces();
  }, []);

  const normalizedKeyword = keyword.trim().toLowerCase();
  const filteredDocSpaces = items.filter((item) => {
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
        {loading ? (
          <div className="rounded-[14px] border border-[#d8e1eb] bg-white px-4 py-8 text-center text-[13px] text-[#667085]">
            正在加载文档空间...
          </div>
        ) : error ? (
          <div className="rounded-[14px] border border-[#f0d2d2] bg-[#fff8f8] px-4 py-8 text-center text-[13px] text-[#a33a3a]">
            {error}
          </div>
        ) : filteredDocSpaces.length ? (
          <KnowHubCardGrid itemWidth={325}>
            {filteredDocSpaces.map((item) => (
              <DocspaceCard
                key={item.id}
                item={item}
              />
            ))}
          </KnowHubCardGrid>
        ) : (
          <div className="rounded-[14px] border border-[#d8e1eb] bg-white px-4 py-8 text-center text-[13px] text-[#667085]">
            当前没有匹配的文档空间。
          </div>
        )}
      </section>

      <DocspaceCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreated={() => void loadDocSpaces()}
      />
    </KnowHubPageShell>
  );
}
