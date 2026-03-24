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
      className="group flex min-h-[232px] w-full flex-col rounded-[10px] border border-dashed border-[#9bb7d7] bg-[linear-gradient(135deg,#f8fbff_0%,#ffffff_100%)] text-left transition-all hover:-translate-y-0.5 hover:border-[#0368b3] hover:bg-[#f6faff] hover:shadow-[0_12px_24px_rgba(26,77,135,0.08)]"
    >
      <div className="flex h-18 shrink-0 items-center justify-start border-b border-dashed border-[#c8d8ea] bg-[#f4f9ff] px-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-[#0368b3] text-xl font-semibold text-white shadow-[0_8px_18px_rgba(3,104,179,0.16)]">
          {icon}
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-4 p-5">
        <div className="min-w-0 space-y-2">
          <h3 className="text-title text-lg font-semibold tracking-[-0.01em]">
            {title}
          </h3>
          <p className="text-sm leading-6 text-[#4d4d4d]">
            {description}
          </p>
        </div>
        <div className="w-fit rounded-[8px] border border-[#d9e5f2] bg-white px-3 py-1 text-xs font-medium text-[#1a4d87]">
          从空白开始
        </div>
      </div>
    </button>
  );
}
