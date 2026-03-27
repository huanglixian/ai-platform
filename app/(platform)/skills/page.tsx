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
const SKILL_GROUP_TABS = SKILL_TABS.filter(
  (tab) => tab !== "全部" && tab !== "精选",
);

export default function SkillsPage() {
  const [keyword, setKeyword] = useState("");
  const [activeTab, setActiveTab] = useState<(typeof SKILL_TABS)[number]>("全部");
  const renderSkillCard = (item: (typeof skillRecords)[number]) => (
    <CapabilityCard
      key={item.id}
      item={item}
      footer={{
        leftLabel: "维护方",
        leftValue: item.owner,
        rightLabel: "调用次数",
        rightValue: item.calls,
      }}
    />
  );
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
  const groupedSkills = SKILL_GROUP_TABS.map((tab) => ({
    key: tab,
    title: tab,
    children: searchedSkills
      .filter((item) => item.category === tab)
      .map(renderSkillCard),
  })).filter((section) => section.children.length > 0);

  return (
    <CardPageFrame
      title="技能中心"
      count={visibleSkills.length}
      itemWidth={ITEM_WIDTH}
      tabs={[...SKILL_TABS]}
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as (typeof SKILL_TABS)[number])}
      groupedSections={groupedSkills}
      searchValue={keyword}
      searchPlaceholder="搜索技能名称或描述"
      onSearchChange={setKeyword}
    >
      {visibleSkills.map(renderSkillCard)}
    </CardPageFrame>
  );
}
