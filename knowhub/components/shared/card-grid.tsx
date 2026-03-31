import type { CSSProperties, ReactNode } from "react";

type KnowHubCardGridProps = {
  children: ReactNode;
  itemWidth: number;
  gapClassName?: string;
};

export function KnowHubCardGrid({
  children,
  itemWidth,
  gapClassName = "gap-4",
}: KnowHubCardGridProps) {
  const gridStyle: CSSProperties = {
    gridTemplateColumns: `repeat(auto-fit, minmax(${itemWidth}px, ${itemWidth}px))`,
  };

  return (
    <div className={`grid justify-start ${gapClassName}`} style={gridStyle}>
      {children}
    </div>
  );
}
