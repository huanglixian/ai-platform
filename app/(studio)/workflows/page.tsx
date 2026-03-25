import { SectionHeader } from "@/components/shared/section-header";
import { PagePlaceholder } from "@/components/shell/page-placeholder";

export default function WorkflowsPage() {
  return (
    <div className="flex w-full flex-col gap-3">
      <SectionHeader title="工作流" count={0} />
      <PagePlaceholder text="工作流页暂未开始实现。" />
    </div>
  );
}
