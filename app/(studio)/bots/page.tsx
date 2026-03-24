import { BotCard } from "@/components/bots/bot-card";
import { CreateCard } from "@/components/cards/create-card";
import { PageHeader } from "@/components/shell/page-header";
import { Button } from "@/components/ui/button";
import { bots } from "@/features/bots/data";

export default function BotsPage() {
  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        title="自由体"
        description="统一管理独立 Bot 的身份、知识、渠道和运行状态。以横向卡片呈现主要信息，保持简洁但不过分生硬。"
        eyebrow="Studio"
        action={<Button className="px-5 font-semibold">创建 Bot</Button>}
      />

      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-title text-[18px] font-semibold tracking-[-0.02em]">
              Bot 列表
            </div>
            <div className="mt-1 text-sm text-[#4d4d4d]">
              共 {bots.length} 个 Bot，当前以横向卡片展示主要状态与指标。
            </div>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          <CreateCard
            icon="＋"
            title="创建自由体"
            description="建立新的 Bot 配置，后续可按业务角色重新组织字段、权限和能力。"
          />
          {bots.map((bot) => (
            <BotCard key={bot.id} bot={bot} />
          ))}
        </div>
      </section>
    </div>
  );
}
