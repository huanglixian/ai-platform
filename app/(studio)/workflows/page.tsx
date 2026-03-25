import { PagePlaceholder } from "@/components/shell/page-placeholder";

export default function WorkflowsPage() {
  return (
    <div className="flex w-full flex-col gap-3">
      <section className="space-y-3">
        <div className="pl-1.5">
          <div className="text-title text-[18px] font-semibold tracking-[-0.02em]">
            工作流
          </div>
          <div className="mt-1 text-sm text-[#667085]">
            工作流页后续会转为画布和节点编辑视图。
          </div>
        </div>
      </section>
      <PagePlaceholder text="工作流页暂未开始实现。" />
    </div>
  );
}
