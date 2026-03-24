import { PageHeader } from "@/components/shell/page-header";

export default function PortalPage() {
  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        title="门户"
        description="门户页后续承载模板、快捷入口和品牌导览。当前先保留占位，等待 bots 页面组件稳定后复用。"
      />
      <div className="border border-dashed border-[#9bb7d7] bg-white p-8 text-sm leading-6 text-secondary">
        门户页暂未开始实现，后续会复用当前壳层、筛选条和卡片骨架。
      </div>
    </div>
  );
}
