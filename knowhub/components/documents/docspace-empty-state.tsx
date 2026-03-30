import { FolderOpen } from "lucide-react";

import { Button } from "@/components/ui/button";

type DocspaceEmptyStateProps = {
  title: string;
  description: string;
};

export function DocspaceEmptyState({
  title,
  description,
}: DocspaceEmptyStateProps) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-[14px] border border-dashed border-[#d5e0eb] bg-[#fbfcfd] px-6 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#eef5fd] text-[#1a4d87]">
        <FolderOpen className="h-5 w-5" />
      </div>
      <div className="text-title text-[17px] font-semibold">{title}</div>
      <p className="max-w-[360px] text-[13px] leading-6 text-[#667085]">
        {description}
      </p>
      <Button variant="outline" size="sm">
        添加文档来源
      </Button>
    </div>
  );
}
