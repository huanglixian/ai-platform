import type { CapabilityRecord } from "@/features/capabilities/types";

type CapabilityCardFooter = {
  leftLabel: string;
  leftValue: string;
  rightLabel: string;
  rightValue: string;
};

type CapabilityCardProps = {
  item: CapabilityRecord;
  footer?: CapabilityCardFooter;
};

export function CapabilityCard({ item, footer }: CapabilityCardProps) {
  const resolvedFooter = footer ?? {
    leftLabel: "调用方式",
    leftValue: item.invokeType,
    rightLabel: "调用次数",
    rightValue: item.calls,
  };

  return (
    <button
      type="button"
      className="w-full appearance-none border-0 bg-transparent p-0 text-left"
    >
      <div className="app-card h-full overflow-hidden">
        <div className="flex min-h-[64px] items-center gap-3 border-b border-[#e8eef5] bg-[linear-gradient(180deg,#f5f9fe_0%,#eff5fb_100%)] px-4 py-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-white text-[18px] shadow-[0_4px_10px_rgba(15,23,42,0.04)]">
            {item.emoji}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-title text-[16px] font-semibold tracking-[-0.02em]">
              {item.name}
            </div>
          </div>
          <div
            className={[
              "text-[14px] leading-none",
              item.featured ? "text-[#f5b301]" : "text-[#d7e1ec]",
            ].join(" ")}
          >
            ★
          </div>
        </div>

        <div className="border-b border-[#eef2f6] bg-white px-4 py-3.5">
          <p className="line-clamp-2 min-h-[44px] text-[13px] leading-5.5 text-[#667085]">
            {item.description}
          </p>
        </div>

        <div className="grid grid-cols-2 bg-white">
          <div className="flex items-center justify-center gap-2 border-r border-[#eef2f6] px-4 py-3 text-center">
            <div className="text-[10px] font-medium tracking-[0.04em] text-[#98a2b3]">
              {resolvedFooter.leftLabel}
            </div>
            <div className="text-title text-[12px] font-medium leading-none">
              {resolvedFooter.leftValue}
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 px-4 py-3 text-center">
            <div className="text-[10px] font-medium tracking-[0.04em] text-[#98a2b3]">
              {resolvedFooter.rightLabel}
            </div>
            <div className="text-title text-[12px] font-medium leading-none">
              {resolvedFooter.rightValue}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
