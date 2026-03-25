import { PagePlaceholder } from "@/components/shell/page-placeholder";

export default function ServicesPage() {
  return (
    <div className="flex w-full flex-col gap-3">
      <section className="space-y-3">
        <div className="pl-1.5">
          <div className="text-title text-[18px] font-semibold tracking-[-0.02em]">
            服务中心
          </div>
          <div className="mt-1 text-sm text-[#667085]">
            服务中心后续承接工具接入、服务编排和外部能力配置。
          </div>
        </div>
      </section>
      <PagePlaceholder text="服务中心页暂未开始实现。" />
    </div>
  );
}
