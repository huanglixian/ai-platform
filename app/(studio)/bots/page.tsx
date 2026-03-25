import { BotCard } from "@/components/bots/bot-card";
import { CreateCard } from "@/components/cards/create-card";
import { Button } from "@/components/ui/button";
import { bots } from "@/features/bots/data";

export default function BotsPage() {
  return (
    <div className="flex w-full flex-col gap-3">
      <section className="space-y-3">
        <div className="space-y-3">
          <div className="flex items-end justify-between pl-1.5">
            <div className="flex items-baseline gap-2.5">
              <div className="text-title text-[18px] font-semibold tracking-[-0.02em]">
                Bot 列表
              </div>
              <div className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#98a2b3]">
                · {bots.length} Items
              </div>
            </div>
            <Button className="h-10 rounded-[8px] px-4 text-sm font-semibold shadow-none">
              创建 Bot
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <CreateCard
              icon="＋"
              title="创建自由体"
              description="建立新的 Bot 配置。"
            />
            {bots.map((bot) => (
              <BotCard key={bot.id} bot={bot} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
