import { SectionHeader } from "@/components/shared/section-header";
import { PagePlaceholder } from "@/components/shared/page-placeholder";

export default function KnowledgePage() {
  return (
    <div className="flex w-full flex-col gap-3">
      <SectionHeader title="知识库" count={0} />
      <PagePlaceholder text="知识库页暂未开始实现。" />
    </div>
  );
}
