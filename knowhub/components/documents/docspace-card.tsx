import { Badge } from "@/components/ui/badge";
import type { DocSpaceRecord } from "@/knowhub/types";

type DocspaceCardProps = {
  item: DocSpaceRecord;
  selected: boolean;
  onSelect: (id: string) => void;
};

const sourceLabelMap = {
  manual: "直接新建",
  ftp: "FTP",
  oss: "OSS",
} as const;

const statusLabelMap = {
  empty: "空空间",
  ready: "已接入",
  syncing: "同步中",
} as const;

export function DocspaceCard({
  item,
  selected,
  onSelect,
}: DocspaceCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      className="w-full rounded-[14px] border px-4 py-4 text-left transition-all"
      style={{
        borderColor: selected ? "#6f96c4" : "#dbe5f0",
        backgroundColor: selected ? "#f4f8fd" : "#ffffff",
        boxShadow: selected
          ? "0 10px 24px rgba(15,23,42,0.06)"
          : "0 6px 18px rgba(15,23,42,0.03)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="text-title text-[15px] font-semibold">{item.name}</div>
          <div className="text-[12px] leading-5 text-[#667085]">{item.summary}</div>
        </div>
        <Badge variant={selected ? "secondary" : "outline"}>
          {statusLabelMap[item.status]}
        </Badge>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge variant="outline">{sourceLabelMap[item.sourceType]}</Badge>
        <Badge variant="outline">{item.documentCount} 份文档</Badge>
        <Badge variant="outline">{item.knowledgeCount} 个知识库</Badge>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-[#7b8798]">
        <div>维护方：{item.owner}</div>
        <div>最近同步：{item.lastSyncAt}</div>
      </div>
    </button>
  );
}
