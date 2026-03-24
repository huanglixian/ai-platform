import { PageHeader } from "@/components/shell/page-header";

export default function KnowledgePage() {
  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        title="知识库"
        description="知识库页后续会复用统一卡片骨架与状态标签，只替换指标和操作区。"
      />
      <div className="border border-dashed border-[#9bb7d7] bg-white p-8 text-sm leading-6 text-secondary">
        知识库页暂未开始实现。
      </div>
    </div>
  );
}
