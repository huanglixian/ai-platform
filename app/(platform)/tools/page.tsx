"use client";

import { useState } from "react";

import { CapabilityCard } from "@/components/shared/capability-card";
import { CardPageFrame } from "@/components/shared/card-page-frame";
import { toolRecords } from "@/features/tools/data";

const ITEM_WIDTH = 296;
const TOOL_TABS = [
  "全部",
  "精选",
  "网络检索",
  "文档处理",
  "地理空间",
  "通用工具",
  "内容辅助",
] as const;

export default function ToolsPage() {
  const [keyword, setKeyword] = useState("");
  const [activeTab, setActiveTab] = useState<(typeof TOOL_TABS)[number]>("全部");
  const normalizedKeyword = keyword.trim().toLowerCase();
  const searchedTools = toolRecords.filter((item) => {
    if (!normalizedKeyword) {
      return true;
    }

    return (
      item.name.toLowerCase().includes(normalizedKeyword) ||
      item.description.toLowerCase().includes(normalizedKeyword)
    );
  });
  const visibleTools = searchedTools.filter((item) => {
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
      title="工具中心"
      count={visibleTools.length}
      itemWidth={ITEM_WIDTH}
      tabs={[...TOOL_TABS]}
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as (typeof TOOL_TABS)[number])}
      searchValue={keyword}
      searchPlaceholder="搜索工具名称或描述"
      onSearchChange={setKeyword}
    >
      {visibleTools.map((item) => (
        <CapabilityCard key={item.id} item={item} />
      ))}
    </CardPageFrame>
  );
}
