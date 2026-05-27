"use client";

import { useState } from "react";

import { CardPageFrame } from "@/components/shared/card-page-frame";
import type { SkillRecord } from "@/features/skills/types";

const ITEM_WIDTH = 340;
const SKILL_TABS = ["全部", "精选", "文本处理", "业务辅助"] as const;
const SKILL_GROUP_TABS = SKILL_TABS.filter(
  (tab) => tab !== "全部" && tab !== "精选",
);

const riskLabels: Record<SkillRecord["riskLevel"], string> = {
  low: "低风险",
  medium: "中风险",
  high: "高风险",
};

type SkillsPageClientProps = {
  skills: SkillRecord[];
};

function SkillCard({ item }: { item: SkillRecord }) {
  return (
    <article className="app-card h-full overflow-hidden">
      <div className="flex min-h-[64px] items-center gap-3 border-b border-[#e8eef5] bg-[linear-gradient(180deg,#f5f9fe_0%,#eff5fb_100%)] px-4 py-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-white text-[18px] shadow-[0_4px_10px_rgba(15,23,42,0.04)]">
          {item.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-title text-[16px] font-semibold tracking-[-0.02em]">
            {item.name}
          </div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <span className="rounded-full border border-[#dbe5f0] bg-white px-2 py-0.5 text-[10px] text-[#51657d]">
              {item.enabled ? "已启用" : "未启用"}
            </span>
            <span className="rounded-full border border-[#dbe5f0] bg-white px-2 py-0.5 text-[10px] text-[#51657d]">
              {riskLabels[item.riskLevel]}
            </span>
          </div>
        </div>
        <div
          className={[
            "text-[14px] leading-none",
            item.featured ? "text-[#f5b301]" : "text-[#d7e1ec]",
          ].join(" ")}
        >
          ★
        </div>
      </div>

      <div className="space-y-3 bg-white px-4 py-3.5">
        <p className="line-clamp-2 min-h-[44px] text-[13px] leading-5.5 text-[#667085]">
          {item.description}
        </p>

        <div className="grid grid-cols-2 gap-2 text-[11px] text-[#667085]">
          <div className="rounded-[10px] border border-[#eef2f6] bg-[#fafbfd] px-3 py-2">
            <div className="mb-1 font-medium text-[#98a2b3]">维护方</div>
            <div className="truncate text-title">{item.owner}</div>
          </div>
          <div className="rounded-[10px] border border-[#eef2f6] bg-[#fafbfd] px-3 py-2">
            <div className="mb-1 font-medium text-[#98a2b3]">调用方式</div>
            <div className="truncate text-title">{item.invokeType}</div>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="text-[11px] font-medium text-[#98a2b3]">输入字段</div>
          <div className="flex flex-wrap gap-1.5">
            {item.inputFields.map((field) => (
              <span
                key={field.name}
                className="rounded-full border border-[#dbe5f0] bg-[#f7fafc] px-2 py-1 text-[11px] text-[#51657d]"
              >
                {field.label}
                {field.required ? " *" : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

export function SkillsPageClient({ skills }: SkillsPageClientProps) {
  const [keyword, setKeyword] = useState("");
  const [activeTab, setActiveTab] = useState<(typeof SKILL_TABS)[number]>("全部");
  const renderSkillCard = (item: SkillRecord) => <SkillCard key={item.id} item={item} />;
  const normalizedKeyword = keyword.trim().toLowerCase();
  const searchedSkills = skills.filter((item) => {
    if (!normalizedKeyword) {
      return true;
    }

    return (
      item.name.toLowerCase().includes(normalizedKeyword) ||
      item.description.toLowerCase().includes(normalizedKeyword) ||
      item.tags.some((tag) => tag.toLowerCase().includes(normalizedKeyword))
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
      searchPlaceholder="搜索技能名称、描述或标签"
      onSearchChange={setKeyword}
    >
      {visibleSkills.map(renderSkillCard)}
    </CardPageFrame>
  );
}
