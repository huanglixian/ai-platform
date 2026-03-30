import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { DocSpaceRecord } from "@/knowhub/types";

type DocspaceCardProps = {
  item: DocSpaceRecord;
};

const sourceLabelMap = {
  manual: "直接新建",
  ftp: "FTP",
  oss: "OSS",
} as const;

const sourceAccentMap = {
  manual: "#0368b3",
  ftp: "#2e7dd2",
  oss: "#1f8a57",
} as const;

const statusLabelMap = {
  empty: "空空间",
  ready: "已接入",
  syncing: "同步中",
} as const;

export function DocspaceCard({
  item,
}: DocspaceCardProps) {
  return (
    <Link
      href={`/knowhub/documents/${item.id}`}
      className="block h-full min-h-[192px] overflow-hidden rounded-[14px] border border-[#dbe5f0] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(250,252,255,0.98)_100%)] text-left transition-all hover:-translate-y-0.5 hover:border-[#bfd7f2] hover:shadow-[0_10px_24px_rgba(15,23,42,0.06)]"
    >
      <div
        className="h-1 w-full"
        style={{
          backgroundColor: sourceAccentMap[item.sourceType],
        }}
      />
      <div className="flex h-[calc(100%-4px)] flex-col px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="text-title text-[15px] font-semibold">{item.name}</div>
            <div className="text-[12px] leading-5 text-[#667085]">{item.summary}</div>
          </div>
          <Badge variant="outline">{statusLabelMap[item.status]}</Badge>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="outline">{sourceLabelMap[item.sourceType]}</Badge>
          <Badge variant="outline">{item.documentCount} 份文档</Badge>
          <Badge variant="outline">{item.knowledgeCount} 个知识库</Badge>
        </div>
        <div className="mt-auto pt-3">
          <div className="grid grid-cols-2 gap-2 text-[11px] text-[#7b8798]">
            <div>维护方：{item.owner}</div>
            <div>最近同步：{item.lastSyncAt}</div>
          </div>
        </div>
      </div>
    </Link>
  );
}
