"use client";

import { useState } from "react";

import { CapabilityCard } from "@/components/shared/capability-card";
import { CardPageFrame } from "@/components/shared/card-page-frame";
import { serviceRecords } from "@/features/services/data";

const ITEM_WIDTH = 296;
const SERVICE_TABS = ["全部", "精选"] as const;

export default function ServicesPage() {
  const [keyword, setKeyword] = useState("");
  const [activeTab, setActiveTab] =
    useState<(typeof SERVICE_TABS)[number]>("全部");
  const normalizedKeyword = keyword.trim().toLowerCase();
  const filteredServices = serviceRecords.filter((item) => {
    if (!normalizedKeyword) {
      return true;
    }

    return (
      item.name.toLowerCase().includes(normalizedKeyword) ||
      item.description.toLowerCase().includes(normalizedKeyword)
    );
  });
  const visibleServices =
    activeTab === "精选"
      ? filteredServices.filter((item) => item.featured)
      : filteredServices;

  return (
    <CardPageFrame
      title="业务API"
      count={visibleServices.length}
      itemWidth={ITEM_WIDTH}
      actionLabel="新建"
      tabs={[...SERVICE_TABS]}
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as (typeof SERVICE_TABS)[number])}
      searchValue={keyword}
      searchPlaceholder="搜索服务名称或描述"
      onSearchChange={setKeyword}
    >
      {visibleServices.map((item) => (
        <CapabilityCard key={item.id} item={item} />
      ))}
    </CardPageFrame>
  );
}
