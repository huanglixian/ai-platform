"use client";

import { useState } from "react";

import { BotCard } from "@/components/bots/bot-card";
import { CreateBotCard } from "@/components/bots/create-bot-card";
import { CardPageSection } from "@/components/shared/card-page-section";
import { bots } from "@/features/bots/data";

export default function BotsPage() {
  const [keyword, setKeyword] = useState("");
  const normalizedKeyword = keyword.trim().toLowerCase();
  const filteredBots = bots.filter((bot) => {
    if (!normalizedKeyword) {
      return true;
    }

    return (
      bot.name.toLowerCase().includes(normalizedKeyword) ||
      bot.description.toLowerCase().includes(normalizedKeyword)
    );
  });

  return (
    <CardPageSection
      title="Bot 列表"
      count={filteredBots.length}
      itemWidth={332}
      tabs={["全部"]}
      activeTab="全部"
      searchValue={keyword}
      searchPlaceholder="搜索 Bot 名称或描述"
      onSearchChange={setKeyword}
    >
      <CreateBotCard
        icon="＋"
        title="创建自由体"
        description="建立新的 Bot 配置。"
      />
      {filteredBots.map((bot) => (
        <BotCard key={bot.id} bot={bot} />
      ))}
    </CardPageSection>
  );
}
