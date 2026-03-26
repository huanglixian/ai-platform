import { PagePlaceholder } from "@/components/shared/page-placeholder";

export default function PortalPage() {
  return (
    <div className="flex w-full flex-col gap-3">
      <section className="space-y-3 pl-1.5">
        <div className="flex items-end gap-2.5">
          <div className="text-title text-[18px] font-semibold tracking-[-0.02em]">
            门户
          </div>
          <div className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#98a2b3]">
            · 0 Items
          </div>
        </div>
      </section>
      <PagePlaceholder text="门户页暂未开始实现，后续会复用当前壳层、筛选条和卡片骨架。" />
    </div>
  );
}
