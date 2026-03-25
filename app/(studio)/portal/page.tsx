import { PagePlaceholder } from "@/components/shell/page-placeholder";

export default function PortalPage() {
  return (
    <div className="flex w-full flex-col gap-3">
      <section className="space-y-3">
        <div className="pl-1.5">
          <div className="text-title text-[18px] font-semibold tracking-[-0.02em]">
            门户
          </div>
          <div className="mt-1 text-sm text-[#667085]">
            门户页后续承载模板、快捷入口和品牌导览。
          </div>
        </div>
      </section>
      <PagePlaceholder text="门户页暂未开始实现，后续会复用当前壳层、筛选条和卡片骨架。" />
    </div>
  );
}
