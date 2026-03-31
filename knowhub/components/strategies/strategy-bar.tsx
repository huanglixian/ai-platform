import Link from "next/link";

import { cn } from "@/lib/utils";
import type { StrategyCategory } from "@/knowhub/types";
import { strategyAccentMap } from "./strategy-colors";

type StrategyBarItem = {
  key: StrategyCategory;
  label: string;
  count: number;
};

type StrategyBarProps = {
  activeCategory: StrategyCategory;
  items: readonly StrategyBarItem[];
};

export function StrategyBar({
  activeCategory,
  items,
}: StrategyBarProps) {
  return (
    <div className="border-b border-[#dde5ee] pb-0.5">
      <div className="grid grid-cols-3 gap-3">
        {items.map((item) => {
          const active = item.key === activeCategory;
          const accent = strategyAccentMap[item.key];

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
