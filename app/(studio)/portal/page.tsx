import { SectionHeader } from "@/components/shared/section-header";
import { PagePlaceholder } from "@/components/shell/page-placeholder";

export default function PortalPage() {
  return (
    <div className="flex w-full flex-col gap-3">
      <SectionHeader title="门户" count={0} />
      <PagePlaceholder text="门户页暂未开始实现，后续会复用当前壳层、筛选条和卡片骨架。" />
    </div>
  );
}
