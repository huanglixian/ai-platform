"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StrategyCard } from "@/knowhub/components/strategies/strategy-card";
import type { StrategyCategory, StrategyRecord } from "@/knowhub/types";
import { useState } from "react";

type StrategyLibraryPanelProps = {
  title: string;
  description: string;
  category: StrategyCategory;
  records: StrategyRecord[];
};

export function StrategyLibraryPanel({
  title,
  description,
  category,
  records,
}: StrategyLibraryPanelProps) {
  const [keyword, setKeyword] = useState("");
  const normalizedKeyword = keyword.trim().toLowerCase();
  const visibleStrategies = records.filter((item) => {
    if (item.category !== category) {
      return false;
    }

    if (!normalizedKeyword) {
      return true;
    }

    return (
      item.name.toLowerCase().includes(normalizedKeyword) ||
      item.summary.toLowerCase().includes(normalizedKeyword) ||
      item.scope.toLowerCase().includes(normalizedKeyword)
    );
  });

  return (
    <section className="rounded-[16px] border border-[#dbe5f0] bg-white px-4 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="flex flex-col gap-3 border-b border-[#eef2f6] pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="text-title text-[15px] font-semibold">{title}</div>
          <div className="text-[12px] text-[#7b8798]">{description}</div>
        </div>
        <div className="flex w-full flex-col gap-2 lg:w-auto lg:flex-row lg:items-center">
          <div className="w-full lg:w-[300px]">
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="搜索策略名称、描述或适用范围"
            />
          </div>
          <Button size="sm">新建策略</Button>
        </div>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleStrategies.map((item) => (
          <StrategyCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
