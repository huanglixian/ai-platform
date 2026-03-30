import { Clock3 } from "lucide-react";

type ComingSoonPanelProps = {
  title: string;
  description: string;
};

export function ComingSoonPanel({
  title,
  description,
}: ComingSoonPanelProps) {
  return (
    <div className="app-card rounded-[14px] px-6 py-10">
      <div className="mx-auto flex max-w-[520px] flex-col items-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#eef5fd] text-[#1a4d87]">
          <Clock3 className="h-5 w-5" />
        </div>
        <div className="text-title text-[18px] font-semibold tracking-[-0.02em]">
          {title}
        </div>
        <p className="text-[13px] leading-6 text-[#667085]">{description}</p>
      </div>
    </div>
  );
}
