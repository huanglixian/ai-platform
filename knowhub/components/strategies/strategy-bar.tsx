import Link from "next/link";

import { cn } from "@/lib/utils";
import type { StrategyCategory } from "@/knowhub/types";

type StrategyBarItem = {
  key: StrategyCategory;
  label: string;
  count: number;
};

type StrategyBarProps = {
  activeCategory: StrategyCategory;
  items: readonly StrategyBarItem[];
};

const accentMap = {
  preprocess: {
    dot: "#c9934c",
    textMuted: "#8a6a44",
    countMuted: "#a08461",
    border: "#b8742a",
    text: "#7f4d1d",
    count: "#9b6630",
  },
  chunking: {
    dot: "#5c90a8",
    textMuted: "#4e7083",
    countMuted: "#6b8ca0",
    border: "#2e7da4",
    text: "#205b79",
    count: "#2f6f92",
  },
  extract: {
    dot: "#5a89bf",
    textMuted: "#4f6f95",
    countMuted: "#6e88a9",
    border: "#0368b3",
    text: "#1a4d87",
    count: "#2c6097",
  },
} as const;

export function StrategyBar({
  activeCategory,
  items,
}: StrategyBarProps) {
  return (
    <div className="border-b border-[#dde5ee] pb-0.5">
      <div className="grid grid-cols-3 gap-3">
        {items.map((item) => {
          const active = item.key === activeCategory;
          const accent = accentMap[item.key];

          return (
            <Link
              key={item.key}
              href={`/knowhub/strategies?tab=${item.key}`}
              className={cn(
                "inline-flex items-center justify-center gap-2 border-b-2 px-0 py-0 text-[12.5px] font-medium transition-colors",
                active
                  ? "text-title"
                  : "border-transparent hover:text-title"
              )}
              style={
                active
                  ? { borderColor: accent.border, color: accent.text }
                  : { color: accent.textMuted }
              }
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: accent.dot }}
              />
              <span>{item.label}</span>
              <span
                className="text-[10px]"
                style={active ? { color: accent.count } : { color: accent.countMuted }}
              >
                {item.count}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
