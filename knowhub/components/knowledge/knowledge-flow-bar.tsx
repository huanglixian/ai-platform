type KnowledgeFlowBarItem = {
  key: string;
  label: string;
  value: string;
};

type KnowledgeFlowBarProps = {
  items: KnowledgeFlowBarItem[];
};

export function KnowledgeFlowBar({ items }: KnowledgeFlowBarProps) {
  return (
    <section className="rounded-[16px] border border-[#d8e1eb] bg-white px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
        {items.map((item, index) => (
          <div
            key={item.key}
            className="rounded-[14px] border border-[#e6edf4] bg-[linear-gradient(180deg,rgba(247,250,253,0.92)_0%,rgba(255,255,255,1)_100%)] px-3 py-3"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#edf5fd] text-[10px] font-semibold text-[#1a4d87]">
                {index + 1}
              </div>
              <div className="text-[12px] font-medium text-[#5f6f82]">{item.label}</div>
            </div>
            <div className="mt-2 text-title text-[13px] font-semibold">{item.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
