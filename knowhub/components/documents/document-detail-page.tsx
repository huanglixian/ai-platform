import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { DocspaceFilePreview } from "@/knowhub/components/documents/docspace-file-preview";
import { KnowHubPageShell } from "@/knowhub/components/layout/knowhub-page-shell";
import { docSpaceRecords } from "@/knowhub/features/docspaces/data";
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
      <section className="rounded-[16px] border border-[#d8e1eb] bg-[linear-gradient(180deg,rgba(244,247,251,0.98)_0%,rgba(255,255,255,0.98)_100%)] px-4.5 py-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-title text-[22px] font-semibold tracking-[-0.03em]">
                {item.name}
              </div>
              <Badge variant="outline">{sourceLabelMap[item.sourceType]}</Badge>
              <Badge variant="outline">{statusLabelMap[item.status]}</Badge>
            </div>
          </div>
          <Link
            href="/knowhub/documents"
            className={cn(
              buttonVariants({ variant: "secondary", size: "sm" }),
              "h-8 shrink-0 px-3 text-[12px]"
            )}
          >
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            返回文档中心
          </Link>
        </div>
        <div className="grid gap-2.5 md:grid-cols-[minmax(0,1.7fr)_160px_160px]">
          <div className="rounded-[12px] border border-[#dde6f0] bg-[linear-gradient(180deg,rgba(236,242,248,0.78)_0%,rgba(247,250,253,0.92)_100%)] px-2.5 py-1.5">
            <div className="text-[11px] text-[#98a2b3]">接入信息</div>
            <div className="mt-0.5 text-[12px] leading-5 text-title">
              {item.connectedTarget}
            </div>
          </div>
          <div className="rounded-[12px] border border-[#dde6f0] bg-[linear-gradient(180deg,rgba(236,242,248,0.78)_0%,rgba(247,250,253,0.92)_100%)] px-2.5 py-1.5">
            <div className="text-[11px] text-[#98a2b3]">文档数量</div>
            <div className="mt-0.5 text-title text-[15px] font-semibold">
              {item.documentCount}
            </div>
          </div>
          <div className="rounded-[12px] border border-[#dde6f0] bg-[linear-gradient(180deg,rgba(236,242,248,0.78)_0%,rgba(247,250,253,0.92)_100%)] px-2.5 py-1.5">
            <div className="text-[11px] text-[#98a2b3]">最近同步</div>
            <div className="mt-0.5 text-[12px] leading-5 text-title">
              {item.lastSyncAt}
            </div>
          </div>
        </div>
      </section>

      <DocspaceFilePreview item={item} />
    </KnowHubPageShell>
  );
}
