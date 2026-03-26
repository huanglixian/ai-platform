"use client";

import { useState } from "react";

import { CapabilityCard } from "@/components/shared/capability-card";
import { CardPageFrame } from "@/components/shared/card-page-frame";
import { serviceRecords } from "@/features/services/data";

const ITEM_WIDTH = 296;

export default function ServicesPage() {
  const [keyword, setKeyword] = useState("");
  const [activeTab, setActiveTab] = useState("全部");
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
      title="服务中心"
      count={visibleServices.length}
      itemWidth={ITEM_WIDTH}
      tabs={["全部", "精选"]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
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
