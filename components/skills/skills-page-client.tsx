"use client";

import { useState } from "react";
import Link from "next/link";

import { CardPageFrame } from "@/components/shared/card-page-frame";
import type { SkillRecord } from "@/features/skills/types";

const ITEM_WIDTH = 300;

type SkillsPageClientProps = {
  skills: SkillRecord[];
};

function SkillCard({ item }: { item: SkillRecord }) {
  return (
    <article className="app-card h-full overflow-hidden">
      <div className="border-b border-[#e8eef5] bg-[linear-gradient(180deg,#f5f9fe_0%,#eff5fb_100%)] px-4 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-title text-[16px] font-semibold tracking-[-0.02em]">
            {item.name}
          </div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <span className="rounded-full border border-[#dbe5f0] bg-white px-2 py-0.5 text-[10px] text-[#51657d]">
              {item.enabled ? "已启用" : "未启用"}
            </span>
            <span className="rounded-full border border-[#dbe5f0] bg-white px-2 py-0.5 text-[10px] text-[#51657d]">
              {item.owner}
            </span>
          </div>
        </div>
        <Link
          href={`/skills/${item.id}`}
          className="shrink-0 rounded-[6px] border border-[#cbd5e1] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#475569] shadow-sm transition-colors hover:border-[#94a3b8] hover:bg-[#f8fafc] hover:text-[#0f172a]"
        >
          配置详情
        </Link>
      </div>

      <div className="space-y-2.5 bg-white px-4 py-3.5">
        <p className="line-clamp-2 text-[13px] leading-5.5 text-[#667085]">
          {item.description}
        </p>

        <div className="space-y-1.5">
          <div className="text-[11px] font-medium text-[#98a2b3]">触发语句</div>
          <div className="flex flex-wrap gap-1.5">
            {item.triggers.slice(0, 4).map((trigger) => (
              <span
                key={trigger}
                className="rounded-full border border-[#dbe5f0] bg-[#f7fafc] px-2 py-1 text-[11px] text-[#51657d]"
              >
                {trigger}
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
  
  const categories = Array.from(new Set(skills.map((item) => item.category)))
    .filter(Boolean)
    .sort((a, b) => (a === "业务技能" ? -1 : b === "业务技能" ? 1 : a.localeCompare(b, "zh-Hans-CN")));
  const skillTabs = ["全部", ...categories];
  const skillGroupTabs = categories;

  const [activeTab, setActiveTab] = useState<string>("全部");
  const renderSkillCard = (item: SkillRecord) => <SkillCard key={item.id} item={item} />;
  const normalizedKeyword = keyword.trim().toLowerCase();
  
  const searchedSkills = skills.filter((item) => {
    if (!normalizedKeyword) {
      return true;
    }

    return (
      item.name.toLowerCase().includes(normalizedKeyword) ||
      item.description.toLowerCase().includes(normalizedKeyword) ||
      item.triggers.some((trigger) => trigger.toLowerCase().includes(normalizedKeyword))
    );
  });

  const visibleSkills = searchedSkills.filter((item) => {
    if (activeTab === "全部") {
      return true;
    }

    return item.category === activeTab;
  });

  const groupedSkills = skillGroupTabs.map((tab) => ({
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
      tabs={skillTabs}
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab)}
      groupedSections={groupedSkills}
      searchValue={keyword}
      searchPlaceholder="搜索技能名称、描述或触发语句"
      onSearchChange={setKeyword}
    >
      {visibleSkills.map(renderSkillCard)}
    </CardPageFrame>
  );
}
