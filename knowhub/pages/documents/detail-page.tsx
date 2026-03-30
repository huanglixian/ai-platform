import Link from "next/link";
import { ArrowLeft, Database, FileText, FolderKanban, RefreshCw } from "lucide-react";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { DocspaceFilePreview } from "@/knowhub/components/documents/docspace-file-preview";
import { KnowHubPageShell } from "@/knowhub/components/layout/knowhub-page-shell";
import { docSpaceRecords } from "@/knowhub/data/docspaces";
import { cn } from "@/lib/utils";

const sourceLabelMap = {
  manual: "直接新建",
  ftp: "FTP 接入",
  oss: "OSS 接入",
} as const;

const statusLabelMap = {
  empty: "空空间",
  ready: "已接入",
  syncing: "同步中",
} as const;

type KnowHubDocumentDetailPageProps = {
  id: string;
};

export function KnowHubDocumentDetailPage({
  id,
}: KnowHubDocumentDetailPageProps) {
  const item = docSpaceRecords.find((record) => record.id === id);

  if (!item) {
    notFound();
  }

  return (
    <KnowHubPageShell>
      <section className="rounded-[16px] border border-[#dbe5f0] bg-white px-5 py-4.5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/knowhub/documents"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-8 px-3 text-[12px]"
              )}
            >
              <ArrowLeft className="mr-1 h-3.5 w-3.5" />
              返回文档中心
            </Link>
            <Badge variant="outline">{sourceLabelMap[item.sourceType]}</Badge>
            <Badge variant="outline">{statusLabelMap[item.status]}</Badge>
          </div>
          <div className="space-y-1">
            <div className="text-title text-[22px] font-semibold tracking-[-0.03em]">
              {item.name}
            </div>
            <div className="max-w-[860px] text-[13px] leading-6 text-[#667085]">
              {item.summary}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="app-card rounded-[14px] px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[rgba(3,104,179,0.10)] text-[#0368b3]">
              <FolderKanban className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] text-[#98a2b3]">维护方</div>
              <div className="mt-1 text-title text-[16px] font-semibold">
                {item.owner}
              </div>
            </div>
          </div>
        </div>
        <div className="app-card rounded-[14px] px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[rgba(46,125,210,0.10)] text-[#2e7dd2]">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] text-[#98a2b3]">文档数量</div>
              <div className="mt-1 text-title text-[16px] font-semibold">
                {item.documentCount}
              </div>
            </div>
          </div>
        </div>
        <div className="app-card rounded-[14px] px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[rgba(31,138,87,0.10)] text-[#1f8a57]">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] text-[#98a2b3]">知识库数量</div>
              <div className="mt-1 text-title text-[16px] font-semibold">
                {item.knowledgeCount}
              </div>
            </div>
          </div>
        </div>
        <div className="app-card rounded-[14px] px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[rgba(208,138,51,0.10)] text-[#d08a33]">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] text-[#98a2b3]">最近同步</div>
              <div className="mt-1 text-title text-[16px] font-semibold">
                {item.lastSyncAt}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[16px] border border-[#dbe5f0] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        <div className="grid gap-2">
          <div className="text-title text-[15px] font-semibold">接入信息</div>
          <div className="text-[12px] leading-6 text-[#667085]">
            当前空间已绑定来源目标：
          </div>
          <div className="rounded-[12px] border border-[#e4ebf3] bg-[#f8fbfe] px-3.5 py-3 text-[13px] text-title">
            {item.connectedTarget}
          </div>
        </div>
      </section>

      <DocspaceFilePreview item={item} />
    </KnowHubPageShell>
  );
}
