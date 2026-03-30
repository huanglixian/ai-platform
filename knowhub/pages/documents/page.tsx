"use client";

import { useState } from "react";
import { Cloud, FolderPlus, HardDriveDownload, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { KnowHubPageShell } from "@/knowhub/components/layout/knowhub-page-shell";
import { DocspaceCard } from "@/knowhub/components/documents/docspace-card";
import { DocspaceCreateCard } from "@/knowhub/components/documents/docspace-create-card";
import { DocspaceFilePreview } from "@/knowhub/components/documents/docspace-file-preview";
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
  const [selectedId, setSelectedId] = useState(docSpaceRecords[0]?.id ?? "");

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

  const selectedDocSpace =
    filteredDocSpaces.find((item) => item.id === selectedId) ??
    filteredDocSpaces[0] ??
    null;

  return (
    <KnowHubPageShell
      title="文档中心"
      description="围绕 DocSpace 管理知识来源。先建立空间，再接入 FTP、OSS 或手工整理的文档内容。"
    >
      <section className="grid gap-4 lg:grid-cols-3">
        <DocspaceCreateCard
          title="直接新建"
          description="创建一个空白 DocSpace，先定义知识主题、归属和维护范围。"
          detail="适合先搭框架、后逐步补内容的业务场景。"
          actionLabel="新建空空间"
          icon={FolderPlus}
          accent="#0368b3"
        />
        <DocspaceCreateCard
          title="接入 FTP"
          description="绑定已有 FTP 文件夹，读取目录快照并持续感知文件变化。"
          detail="适合院内共享盘、项目资料目录和阶段性成果文件夹。"
          actionLabel="连接 FTP"
          icon={HardDriveDownload}
          accent="#2e7dd2"
        />
        <DocspaceCreateCard
          title="接入 OSS"
          description="绑定对象存储桶，按桶路径组织知识来源和同步范围。"
          detail="适合跨项目沉淀、集中归档和云端协同资料场景。"
          actionLabel="连接 OSS"
          icon={Cloud}
          accent="#1f8a57"
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="rounded-[16px] border border-[#dbe5f0] bg-white px-4 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <div className="flex items-center gap-2 rounded-[12px] border border-[#e5ebf2] bg-[#fbfcfd] px-3">
            <Search className="h-4 w-4 text-[#98a2b3]" />
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="搜索 DocSpace 名称或描述"
              className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
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
          <div className="mt-4 space-y-3">
            {filteredDocSpaces.map((item) => (
              <DocspaceCard
                key={item.id}
                item={item}
                selected={selectedDocSpace?.id === item.id}
                onSelect={setSelectedId}
              />
            ))}
          </div>
        </div>

        <DocspaceFilePreview item={selectedDocSpace} />
      </section>
    </KnowHubPageShell>
  );
}
