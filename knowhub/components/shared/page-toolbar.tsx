"use client";

import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type PageToolbarTab = {
  key: string;
  label: string;
};

type KnowHubPageToolbarProps<T extends string> = {
  topSlot?: React.ReactNode;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  tabs: readonly (Omit<PageToolbarTab, "key"> & { key: T })[];
  activeTab: T;
  onTabChange: (key: T) => void;
  actionLabel?: string;
  onAction?: () => void;
};

export function KnowHubPageToolbar<T extends string>({
  topSlot,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  tabs,
  activeTab,
  onTabChange,
  actionLabel,
  onAction,
}: KnowHubPageToolbarProps<T>) {
  return (
    <section className="rounded-[18px] border border-[#d8e1eb] bg-[linear-gradient(180deg,rgba(237,242,248,0.96)_0%,rgba(246,249,253,0.98)_100%)] px-4 py-3 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
      <div className="flex flex-col gap-3">
        {topSlot ? <div>{topSlot}</div> : null}

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex items-center gap-2 rounded-[12px] border border-[#dce5ee] bg-[rgba(255,255,255,0.82)] px-3 md:w-[360px]">
              <Search className="h-4 w-4 text-[#98a2b3]" />
              <Input
                value={searchValue}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={searchPlaceholder}
                className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => {
                const active = tab.key === activeTab;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => onTabChange(tab.key)}
                    className="rounded-full border px-3 py-1 text-[11px] font-medium transition-colors"
                    style={{
                      borderColor: active ? "#c7d7ea" : "#d9e3ed",
                      backgroundColor: active ? "#e9f0f8" : "rgba(255,255,255,0.72)",
                      color: active ? "#1a4d87" : "#667085",
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {actionLabel && onAction ? (
            <Button
              variant="default"
              size="default"
              onClick={onAction}
              className="w-full md:w-auto md:shrink-0"
            >
              {actionLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
