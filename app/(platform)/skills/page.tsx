import { SectionHeader } from "@/components/shared/section-header";
import { PagePlaceholder } from "@/components/shared/page-placeholder";

export default function SkillsPage() {
  return (
    <div className="flex w-full flex-col gap-3">
      <SectionHeader title="技能中心" count={0} />
      <PagePlaceholder text="技能中心页暂未开始实现。" />
    </div>
  );
}
