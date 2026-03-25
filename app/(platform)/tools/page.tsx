import { PagePlaceholder } from "@/components/shared/page-placeholder";
import { SectionHeader } from "@/components/shared/section-header";

export default function ToolsPage() {
  return (
    <div className="flex w-full flex-col gap-3">
      <SectionHeader title="工具中心" count={0} />
      <PagePlaceholder text="工具中心页暂未开始实现。" />
    </div>
  );
}
