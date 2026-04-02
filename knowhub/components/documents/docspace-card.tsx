import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { DocSpaceRecord } from "@/knowhub/features/docspaces/types";

type DocspaceCardProps = {
  item: DocSpaceRecord;
};

const sourceLabelMap = {
  manual: "直接新建",
  ftp: "FTP",
  oss: "OSS",
} as const;

const sourceAccentMap = {
  manual: "#7a8fad",
  ftp: "#5c8f72",
  oss: "#4a83c5",
} as const;

export function DocspaceCard({
  item,
}: DocspaceCardProps) {
  return (
    <Link
      href={`/knowhub/documents/${item.id}`}
      className="block h-full min-h-[192px] overflow-hidden rounded-[14px] border border-[#d8e1eb] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(246,249,253,0.98)_100%)] text-left transition-all hover:-translate-y-0.5 hover:border-[#bfd0e2] hover:shadow-[0_10px_24px_rgba(15,23,42,0.06)]"
    >
      <div
        className="h-1 w-full"
        style={{
          background: `linear-gradient(90deg, ${sourceAccentMap[item.sourceType]} 0%, color-mix(in srgb, ${sourceAccentMap[item.sourceType]} 58%, white) 100%)`,
        }}
      />
      <div className="flex h-[calc(100%-4px)] flex-col px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="text-title text-[15px] font-semibold">{item.name}</div>
            <div className="text-[12px] leading-5 text-[#667085]">{item.summary}</div>
          </div>
          <Badge variant="outline">{sourceLabelMap[item.sourceType]}</Badge>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="outline">{item.documentCount} 份文档</Badge>
          <Badge variant="outline">{item.folderCount} 个文件夹</Badge>
          <Badge variant="outline">{item.totalSizeLabel}</Badge>
        </div>
        <div className="mt-auto pt-3">
          <div className="grid grid-cols-3 gap-2 text-[11px] text-[#7b8798]">
            <div className="truncate">维护方：{item.owner}</div>
            <div className="col-span-2 text-right">最近同步：{item.lastSyncAt}</div>
          </div>
        </div>
      </div>
    </Link>
  );
}
