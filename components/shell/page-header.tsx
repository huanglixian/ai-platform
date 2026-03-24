import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description: string;
  action?: ReactNode;
  eyebrow?: string;
};

export function PageHeader({
  title,
  description,
  action,
  eyebrow,
}: PageHeaderProps) {
  return (
    <section className="flex flex-col gap-4 rounded-[10px] border border-border bg-white px-6 py-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1.5">
        {eyebrow ? (
          <div className="inline-flex w-fit rounded-[8px] bg-[#f4f8fd] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1a4d87]">
            {eyebrow}
          </div>
        ) : null}
        <div>
          <h1 className="text-title text-[32px] font-semibold tracking-[-0.03em]">
            {title}
          </h1>
          <p className="mt-1.5 max-w-2xl text-[14px] leading-6 text-[#4d4d4d]">
            {description}
          </p>
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </section>
  );
}
