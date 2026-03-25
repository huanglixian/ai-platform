import type { ReactNode } from "react";

type CreateCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
};

export function CreateCard({ icon, title, description }: CreateCardProps) {
  return (
    <button
      type="button"
      className="group flex min-h-[176px] w-full flex-col rounded-[10px] border border-dashed border-[#cad6e2] bg-[rgba(255,255,255,0.72)] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#7fa8d3] hover:bg-white hover:shadow-[0_10px_24px_rgba(15,23,42,0.06)]"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#0368b3] text-lg font-semibold text-white shadow-[0_8px_18px_rgba(3,104,179,0.14)]">
        {icon}
      </div>
      <div className="mt-4 flex min-w-0 flex-1 flex-col justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <h3 className="text-title text-[18px] font-semibold tracking-[-0.02em]">
            {title}
          </h3>
          <p className="line-clamp-2 text-[13px] leading-6 text-[#667085]">
            {description}
          </p>
        </div>
        <div className="w-fit rounded-[999px] border border-[#dbe5f0] bg-white px-3 py-1 text-[11px] font-medium text-[#356da8]">
          从空白开始
        </div>
      </div>
    </button>
  );
}
