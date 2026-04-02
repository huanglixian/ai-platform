import type { ReactNode } from "react";

type KnowledgeStepCardProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function KnowledgeStepCard({
  title,
  description,
  children,
}: KnowledgeStepCardProps) {
  return (
    <section className="rounded-[16px] border border-[#d8e1eb] bg-white px-4 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div>
        <div className="text-title text-[16px] font-semibold tracking-[-0.02em]">
          {title}
        </div>
        <div className="mt-1 text-[12px] leading-5 text-[#667085]">{description}</div>
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}
