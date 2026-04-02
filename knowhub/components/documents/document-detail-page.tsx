import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { buttonVariants } from "@/components/ui/button-variants";
import { DocspaceDeleteButton } from "@/knowhub/components/documents/docspace-delete-button";
import { DocspaceFilePreview } from "@/knowhub/components/documents/docspace-file-preview";
import { KnowHubPageShell } from "@/knowhub/components/layout/knowhub-page-shell";
import type { DocSpaceRecord } from "@/knowhub/features/docspaces/types";
import { cn } from "@/lib/utils";

const sourceLabelMap = {
  hosted: "本地空间",
  smb: "SMB 接入",
  oss: "OSS 接入",
} as const;

type KnowHubDocumentDetailPageProps = {
  item: DocSpaceRecord;
};

export function KnowHubDocumentDetailPage({
  item,
}: KnowHubDocumentDetailPageProps) {
  return (
    <KnowHubPageShell>
      <section className="rounded-[16px] border border-[#d8e1eb] bg-[linear-gradient(180deg,rgba(244,247,251,0.98)_0%,rgba(255,255,255,0.98)_100%)] px-4.5 py-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-title text-[22px] font-semibold tracking-[-0.03em]">
                {item.name}
              </div>
              <DocspaceDeleteButton id={item.id} />
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
        <div className="grid gap-2.5 md:grid-cols-[minmax(0,1.4fr)_140px_150px]">
          <div className="rounded-[12px] border border-[#dde6f0] bg-[linear-gradient(180deg,rgba(236,242,248,0.78)_0%,rgba(247,250,253,0.92)_100%)] px-3 py-2">
            <div className="truncate text-[12px] text-title">
              <span className="text-[#98a2b3]">
                接入信息（{sourceLabelMap[item.sourceType]}）：
              </span>
              {item.connectedTarget}
            </div>
          </div>
          <div className="rounded-[12px] border border-[#dde6f0] bg-[linear-gradient(180deg,rgba(236,242,248,0.78)_0%,rgba(247,250,253,0.92)_100%)] px-3 py-2">
            <div className="text-[12px] text-title">
              <span className="text-[#98a2b3]">文档数量：</span>
              <span className="text-[15px] font-semibold">{item.documentCount}</span>
            </div>
          </div>
          <div className="rounded-[12px] border border-[#dde6f0] bg-[linear-gradient(180deg,rgba(236,242,248,0.78)_0%,rgba(247,250,253,0.92)_100%)] px-3 py-2">
            <div className="text-[12px] text-title">
              <span className="text-[#98a2b3]">最近同步：</span>
              {item.lastSyncAt}
            </div>
          </div>
        </div>
      </section>

      <DocspaceFilePreview item={item} />
    </KnowHubPageShell>
  );
}
