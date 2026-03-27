import type { ReactNode } from "react";

type CardPageGroup = {
  key: string;
  title: string;
  children: ReactNode;
};

type CardPageFrameProps = {
  title: string;
  count: number;
  itemWidth: number;
  children: ReactNode;
  groupedSections?: CardPageGroup[];
  tabs?: string[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  searchValue?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
};

export function CardPageFrame({
  title,
  count,
  itemWidth,
  children,
  groupedSections,
  tabs,
  activeTab,
  onTabChange,
  searchValue,
  searchPlaceholder,
  onSearchChange,
}: CardPageFrameProps) {
  const gridStyle = {
    gridTemplateColumns: `repeat(auto-fit, minmax(${itemWidth}px, ${itemWidth}px))`,
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <section className="space-y-3 pl-1.5">
        <div className="flex items-end gap-2.5">
          <div className="text-title text-[18px] font-semibold tracking-[-0.02em]">
            {title}
          </div>
          <div className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#98a2b3]">
            · {count} Items
          </div>
        </div>
      </section>
      {typeof searchValue === "string" && onSearchChange ? (
        <div className="flex justify-center">
          <div className="w-[50%] min-w-[280px]">
            <input
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={searchPlaceholder ?? "搜索"}
              className="h-[35px] w-full rounded-[10px] border border-[#dbe5f0] bg-white px-4 text-[13px] text-title outline-none transition-colors placeholder:text-[#98a2b3] focus:border-[#6f96c4]"
            />
          </div>
        </div>
      ) : null}
      <section className="flex flex-col gap-3">
        <div className="grid justify-center gap-4" style={gridStyle}>
          {tabs?.length ? (
            <div className="flex flex-wrap gap-2" style={{ gridColumn: "1 / -1" }}>
              {tabs.map((tab) => {
                const selected = tab === activeTab;

                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => onTabChange?.(tab)}
                    className={[
                      "h-[27px] rounded-full border px-3 text-[11px] font-medium transition-colors",
                      selected
                        ? "border-[#bfd7f2] bg-[#eef5fd] text-[#1a4d87]"
                        : "border-[#e5ebf2] bg-white text-[#667085] hover:border-[#d8e4f0] hover:text-title",
                    ].join(" ")}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          ) : null}
          {activeTab === "全部" && groupedSections?.length
            ? groupedSections.flatMap((section) => [
                <div
                  key={`${section.key}-title`}
                  className="text-[12px] font-semibold tracking-[0.02em] text-[#667085]"
                  style={{ gridColumn: "1 / -1" }}
                >
                  {section.title}
                </div>,
                section.children,
              ])
            : children}
        </div>
      </section>
    </div>
  );
}
