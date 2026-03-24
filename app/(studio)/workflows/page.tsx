import { PageHeader } from "@/components/shell/page-header";

export default function WorkflowsPage() {
  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        title="工作流"
        description="工作流页后续会使用同一套壳层，但内容区会转为画布和节点编辑视图。"
      />
      <div className="border border-dashed border-[#9bb7d7] bg-white p-8 text-sm leading-6 text-secondary">
        工作流页暂未开始实现。
      </div>
    </div>
  );
}
