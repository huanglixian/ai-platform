import type { ReactNode } from "react";

type KnowHubPageShellProps = {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
};

export function KnowHubPageShell({
  title,
  description,
  action,
  children,
}: KnowHubPageShellProps) {
  return (
    <div className="flex w-full flex-col gap-5">
      <section className="flex flex-col gap-3 rounded-[14px] border border-[#d8e1eb] bg-white/92 px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-title text-[22px] font-semibold tracking-[-0.02em]">
            {title}
          </h1>
          <p className="max-w-[760px] text-[13px] leading-6 text-[#667085]">
            {description}
          </p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </section>
      {children}
    </div>
  );
}
