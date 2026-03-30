import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  accent: string;
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent,
}: StatCardProps) {
  return (
    <div className="app-card rounded-[14px] px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <div className="text-[11px] font-medium tracking-[0.05em] text-[#98a2b3]">
            {label}
          </div>
          <div className="text-title text-[28px] font-semibold tracking-[-0.03em]">
            {value}
          </div>
          <div className="text-[12px] text-[#667085]">{hint}</div>
        </div>
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]"
          style={{
            backgroundColor: `${accent}16`,
            color: accent,
          }}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
