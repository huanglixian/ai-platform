import type { ReactNode } from "react";

type SectionHeaderProps = {
  title: string;
  count: number;
  action?: ReactNode;
};

export function SectionHeader({
  title,
  count,
  action,
}: SectionHeaderProps) {
  return (
    <section className="space-y-3 pl-1.5">
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-baseline gap-2.5">
          <div className="text-title text-[18px] font-semibold tracking-[-0.02em]">
            {title}
          </div>
          <div className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#98a2b3]">
            · {count} Items
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </section>
  );
}
