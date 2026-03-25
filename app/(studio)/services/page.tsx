import { SectionHeader } from "@/components/shared/section-header";
import { PagePlaceholder } from "@/components/shell/page-placeholder";

export default function ServicesPage() {
  return (
    <div className="flex w-full flex-col gap-3">
      <SectionHeader title="服务中心" count={0} />
      <PagePlaceholder text="服务中心页暂未开始实现。" />
    </div>
  );
}
