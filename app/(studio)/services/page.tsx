import { PageHeader } from "@/components/shell/page-header";

export default function ServicesPage() {
  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        title="服务中心"
        description="服务中心会承接工具接入、服务编排和外部能力配置，后续再细化。"
      />
      <div className="border border-dashed border-[#9bb7d7] bg-white p-8 text-sm leading-6 text-secondary">
        服务中心页暂未开始实现。
      </div>
    </div>
  );
}
