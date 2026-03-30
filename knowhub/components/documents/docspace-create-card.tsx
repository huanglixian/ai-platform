import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

type DocspaceCreateCardProps = {
  title: string;
  description: string;
  detail: string;
  actionLabel: string;
  icon: LucideIcon;
  accent: string;
};

export function DocspaceCreateCard({
  title,
  description,
  detail,
  actionLabel,
  icon: Icon,
  accent,
}: DocspaceCreateCardProps) {
  return (
    <div className="app-card rounded-[14px] px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]"
          style={{ backgroundColor: `${accent}16`, color: accent }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div
          className="rounded-full border px-2 py-0.5 text-[10px] font-medium"
          style={{ borderColor: `${accent}2e`, color: accent }}
        >
          新建方式
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="text-title text-[15px] font-semibold">{title}</div>
        <div className="text-[12px] leading-5 text-[#667085]">{description}</div>
        <div className="rounded-[10px] bg-[#f7fafd] px-3 py-2 text-[11px] leading-5 text-[#7b8798]">
          {detail}
        </div>
      </div>
      <div className="mt-4">
        <Button variant="outline" size="sm">
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}
