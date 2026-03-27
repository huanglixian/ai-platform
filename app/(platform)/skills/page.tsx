"use client";

import { useState } from "react";

import { CapabilityCard } from "@/components/shared/capability-card";
import { CardPageFrame } from "@/components/shared/card-page-frame";
import { skillRecords } from "@/features/skills/data";

const ITEM_WIDTH = 296;
const SKILL_TABS = [
  "全部",
  "精选",
  "数据获取",
  "数据提取",
  "业务辅助",
  "报告校审",
  "报告生成",
] as const;

export default function SkillsPage() {
  const [keyword, setKeyword] = useState("");
  const [activeTab, setActiveTab] = useState<(typeof SKILL_TABS)[number]>("全部");
  const normalizedKeyword = keyword.trim().toLowerCase();
  const searchedSkills = skillRecords.filter((item) => {
    if (!normalizedKeyword) {
      return true;
    }

    return (
      item.name.toLowerCase().includes(normalizedKeyword) ||
      item.description.toLowerCase().includes(normalizedKeyword)
    );
  });
  const visibleSkills = searchedSkills.filter((item) => {
    if (activeTab === "全部") {
      return true;
    }

    if (activeTab === "精选") {
      return item.featured;
    }

    return item.category === activeTab;
  });

  return (
    <CardPageFrame
      title="技能中心"
      count={visibleSkills.length}
      itemWidth={ITEM_WIDTH}
      tabs={[...SKILL_TABS]}
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as (typeof SKILL_TABS)[number])}
      searchValue={keyword}
      searchPlaceholder="搜索技能名称或描述"
      onSearchChange={setKeyword}
    >
      {visibleSkills.map((item) => (
        <CapabilityCard key={item.id} item={item} />
      ))}
    </CardPageFrame>
  );
}
