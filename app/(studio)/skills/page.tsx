import { PageHeader } from "@/components/shell/page-header";

export default function SkillsPage() {
  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        title="技能中心"
        description="技能中心后续会复用筛选区和卡片骨架，重点放在发现、安装和关联 Bot。"
      />
      <div className="border border-dashed border-[#9bb7d7] bg-white p-8 text-sm leading-6 text-secondary">
        技能中心页暂未开始实现。
      </div>
    </div>
  );
}
