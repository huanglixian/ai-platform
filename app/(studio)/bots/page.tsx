import { BotCard } from "@/components/bots/bot-card";
import { CreateBotCard } from "@/components/bots/create-bot-card";
import { SectionHeader } from "@/components/shared/section-header";
import { bots } from "@/features/bots/data";

export default function BotsPage() {
  return (
    <div className="flex w-full flex-col gap-3">
      <SectionHeader title="Bot 列表" count={bots.length} />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <CreateBotCard
          icon="＋"
          title="创建自由体"
          description="建立新的 Bot 配置。"
        />
        {bots.map((bot) => (
          <BotCard key={bot.id} bot={bot} />
        ))}
      </div>
    </div>
  );
}
