"use client";

import { useState } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { KnowHubPageShell } from "@/knowhub/components/layout/knowhub-page-shell";
import { DocspaceCard } from "@/knowhub/components/documents/docspace-card";
import { DocspaceCreateCard } from "@/knowhub/components/documents/docspace-create-card";
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
      <section className="rounded-[18px] border border-[#dbe5f0] bg-[linear-gradient(180deg,rgba(242,247,252,0.95)_0%,rgba(255,255,255,0.98)_100%)] px-4 py-4 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 rounded-[12px] border border-[#e5ebf2] bg-[#fbfcfd] px-3 md:w-[360px]">
            <Search className="h-4 w-4 text-[#98a2b3]" />
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="搜索 DocSpace 名称或描述"
              className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {sourceTabs.map((tab) => {
              const active = tab.key === sourceFilter;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSourceFilter(tab.key)}
                  className="rounded-full border px-3 py-1 text-[11px] font-medium transition-colors"
                  style={{
                    borderColor: active ? "#bfd7f2" : "#dfe7ef",
                    backgroundColor: active ? "#eef5fd" : "#ffffff",
                    color: active ? "#1a4d87" : "#667085",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="rounded-[20px] border border-[#e5edf6] bg-[#f5f8fc] px-3 py-3 sm:px-4 sm:py-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <DocspaceCreateCard />

        {filteredDocSpaces.map((item) => (
          <DocspaceCard
            key={item.id}
            item={item}
          />
        ))}
        </div>
      </section>
    </KnowHubPageShell>
  );
}
