"use client";

import { useState } from "react";

import { KnowHubPageShell } from "@/knowhub/components/layout/knowhub-page-shell";
import { KnowHubCardGrid } from "@/knowhub/components/shared/card-grid";
import { KnowHubPageToolbar } from "@/knowhub/components/shared/page-toolbar";
import { StrategyBar } from "@/knowhub/components/strategies/strategy-bar";
import { StrategyCard } from "@/knowhub/components/strategies/strategy-card";
import { strategyRecords } from "@/knowhub/data/strategies";
import type { StrategyCategory, StrategyRecord } from "@/knowhub/types";

type KnowHubStrategiesPageProps = {
  activeCategory: StrategyCategory;
};

const categoryMeta = {
  preprocess: {
    label: "预处理策略",
    searchPlaceholder: "搜索预处理策略名称、描述或适用范围",
    emptyTitle: "还没有预处理策略",
    emptyDescription: "可以先新建一条预处理规则，统一清洗、归并和结构整理方式。",
  },
  chunking: {
    label: "切片策略",
    searchPlaceholder: "搜索切片策略名称、描述或适用范围",
    emptyTitle: "还没有切片策略",
    emptyDescription: "可以先新建一条切片规则，统一标题、上下文和问答切片方式。",
  },
  extract: {
    label: "提取策略",
    searchPlaceholder: "搜索提取策略名称、描述或适用范围",
    emptyTitle: "提取策略待建立",
    emptyDescription: "提取策略将用于结构化字段、表格要点和目标信息抽取，当前可先保留为空。",
  },
} as const satisfies Record<StrategyCategory, {
  label: string;
  searchPlaceholder: string;
  emptyTitle: string;
  emptyDescription: string;
}>;

function matchesKeyword(item: StrategyRecord, keyword: string) {
  if (!keyword) {
    return true;
  }

  const normalizedKeyword = keyword.trim().toLowerCase();

  return (
    item.name.toLowerCase().includes(normalizedKeyword) ||
    item.summary.toLowerCase().includes(normalizedKeyword) ||
    item.group.toLowerCase().includes(normalizedKeyword) ||
    item.metaValue.toLowerCase().includes(normalizedKeyword)
  );
}

export function KnowHubStrategiesPage({
  activeCategory,
}: KnowHubStrategiesPageProps) {
  const [keyword, setKeyword] = useState("");
  const activeCategoryRecords = strategyRecords.filter(
    (item) => item.category === activeCategory,
  );
  const groupTabs = [
    { key: "all", label: "全部" },
    ...Array.from(new Set(activeCategoryRecords.map((item) => item.group))).map((group) => ({
      key: group,
      label: group,
    })),
  ] as const;
  const [groupFilter, setGroupFilter] = useState<(typeof groupTabs)[number]["key"]>("all");
  const resolvedGroupFilter = groupTabs.some((tab) => tab.key === groupFilter)
    ? groupFilter
    : "all";

  const categoryCounts = {
    preprocess: strategyRecords.filter((item) => item.category === "preprocess").length,
    chunking: strategyRecords.filter((item) => item.category === "chunking").length,
    extract: strategyRecords.filter((item) => item.category === "extract").length,
  } as const;

  const visibleStrategies = strategyRecords.filter((item) => {
    if (item.category !== activeCategory) {
      return false;
    }

    if (resolvedGroupFilter !== "all" && item.group !== resolvedGroupFilter) {
      return false;
    }

    return matchesKeyword(item, keyword);
  });

  return (
    <KnowHubPageShell>
      <KnowHubPageToolbar
        topSlot={(
          <StrategyBar
            activeCategory={activeCategory}
            items={[
              {
                key: "preprocess",
                label: categoryMeta.preprocess.label,
                count: categoryCounts.preprocess,
              },
              {
                key: "chunking",
                label: categoryMeta.chunking.label,
                count: categoryCounts.chunking,
              },
              {
                key: "extract",
                label: categoryMeta.extract.label,
                count: categoryCounts.extract,
              },
            ]}
          />
        )}
        searchValue={keyword}
        onSearchChange={setKeyword}
        searchPlaceholder={categoryMeta[activeCategory].searchPlaceholder}
        tabs={groupTabs}
        activeTab={resolvedGroupFilter}
        onTabChange={setGroupFilter}
        actionLabel="新建策略"
      />

      {visibleStrategies.length ? (
        <section className="rounded-[20px] border border-[#dde6f0] bg-[linear-gradient(180deg,rgba(236,241,247,0.92)_0%,rgba(244,247,251,0.96)_100%)] px-3 py-3 sm:px-4 sm:py-4">
          <KnowHubCardGrid itemWidth={320}>
            {visibleStrategies.map((item) => (
              <StrategyCard key={item.id} item={item} />
            ))}
          </KnowHubCardGrid>
        </section>
      ) : (
        <section className="rounded-[16px] border border-[#d8e1eb] bg-white px-5 py-8 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <div className="max-w-[520px]">
            <div className="text-title text-[16px] font-semibold">
              {categoryMeta[activeCategory].emptyTitle}
            </div>
            <div className="mt-2 text-[13px] leading-6 text-[#667085]">
              {categoryMeta[activeCategory].emptyDescription}
            </div>
          </div>
        </section>
      )}
    </KnowHubPageShell>
  );
}
