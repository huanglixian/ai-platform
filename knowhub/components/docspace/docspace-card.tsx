import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { DocSpaceRecord } from "@/knowhub/features/docspace/types";

type DocSpaceCardProps = {
  item: DocSpaceRecord;
};

const sourceLabelMap = {
  hosted: "本地空间",
  smb: "SMB",
  oss: "OSS",
} as const;

const sourceAccentMap = {
  hosted: "#7a8fad",
  smb: "#5c8f72",
  oss: "#4a83c5",
} as const;

const sourceHintMap = {
  hosted: "平台托管空间，可直接上传文档。",
  smb: "共享目录已接入，可同步文件快照。",
  oss: "对象存储已接入，可按目录浏览文件。",
} as const;

export function DocSpaceCard({
  item,
}: DocSpaceCardProps) {
  const summary = item.summary.trim() || sourceHintMap[item.sourceType];

  return (
    <Link
      href={`/knowhub/docspace/${item.id}`}
      className="block h-full min-h-[208px] overflow-hidden rounded-[14px] border border-[#d8e1eb] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(246,249,253,0.98)_100%)] text-left transition-all hover:-translate-y-0.5 hover:border-[#bfd0e2] hover:shadow-[0_10px_24px_rgba(15,23,42,0.06)]"
    >
      <div
        className="h-1 w-full"
        style={{
          background: `linear-gradient(90deg, ${sourceAccentMap[item.sourceType]} 0%, color-mix(in srgb, ${sourceAccentMap[item.sourceType]} 58%, white) 100%)`,
        }}
      />
      <div className="flex h-[calc(100%-4px)] flex-col px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="text-title text-[15px] font-semibold">{item.name}</div>
            <div className="line-clamp-2 text-[12px] leading-5 text-[#667085]">{summary}</div>
          </div>
          <Badge variant="outline">{sourceLabelMap[item.sourceType]}</Badge>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-[12px]">
          <div className="rounded-[12px] border border-[#eef2f6] bg-white px-3 py-2">
            <div className="text-[#98a2b3]">文档</div>
            <div className="mt-1 text-title font-medium">{item.documentCount}</div>
          </div>
          <div className="rounded-[12px] border border-[#eef2f6] bg-white px-3 py-2">
            <div className="text-[#98a2b3]">文件夹</div>
            <div className="mt-1 text-title font-medium">{item.folderCount}</div>
          </div>
          <div className="rounded-[12px] border border-[#eef2f6] bg-white px-3 py-2">
            <div className="text-[#98a2b3]">容量</div>
            <div className="mt-1 text-title font-medium">{item.totalSizeLabel}</div>
          </div>
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
