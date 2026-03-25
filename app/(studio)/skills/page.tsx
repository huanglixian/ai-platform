import { PagePlaceholder } from "@/components/shell/page-placeholder";

export default function SkillsPage() {
  return (
    <div className="flex w-full flex-col gap-3">
      <section className="space-y-3">
        <div className="pl-1.5">
          <div className="text-title text-[18px] font-semibold tracking-[-0.02em]">
            技能中心
          </div>
          <div className="mt-1 text-sm text-[#667085]">
            技能中心后续会复用筛选区和卡片骨架。
          </div>
        </div>
      </section>
      <PagePlaceholder text="技能中心页暂未开始实现。" />
    </div>
  );
}
