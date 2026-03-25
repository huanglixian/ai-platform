import { PagePlaceholder } from "@/components/shell/page-placeholder";

export default function KnowledgePage() {
  return (
    <div className="flex w-full flex-col gap-3">
      <section className="space-y-3">
        <div className="pl-1.5">
          <div className="text-title text-[18px] font-semibold tracking-[-0.02em]">
            知识库
          </div>
          <div className="mt-1 text-sm text-[#667085]">
            知识库页后续会复用统一卡片骨架与状态标签。
          </div>
        </div>
      </section>
      <PagePlaceholder text="知识库页暂未开始实现。" />
    </div>
  );
}
