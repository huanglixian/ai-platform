type IntroPanelProps = {
  title: string;
  description: string;
  bullets: string[];
};

export function IntroPanel({
  title,
  description,
  bullets,
}: IntroPanelProps) {
  return (
    <section className="overflow-hidden rounded-[16px] border border-[#dbe5f0] bg-[linear-gradient(135deg,rgba(239,245,251,0.96)_0%,rgba(255,255,255,0.98)_52%,rgba(246,249,253,0.96)_100%)] shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
      <div className="grid gap-5 px-6 py-6 lg:grid-cols-[1.25fr_0.9fr]">
        <div className="space-y-3">
          <div className="inline-flex rounded-full border border-[#d6e4f2] bg-white px-3 py-1 text-[11px] font-medium tracking-[0.04em] text-[#5c7fa8]">
            KNOWLEDGE BUSINESS DOMAIN
          </div>
          <h2 className="text-title text-[26px] font-semibold tracking-[-0.03em]">
            {title}
          </h2>
          <p className="max-w-[680px] text-[14px] leading-7 text-[#667085]">
            {description}
          </p>
        </div>
        <div className="rounded-[14px] border border-[#e5edf5] bg-white/90 p-4">
          <div className="text-title text-[13px] font-semibold">当前设计重点</div>
          <div className="mt-3 space-y-2.5">
            {bullets.map((item) => (
              <div
                key={item}
                className="flex gap-2.5 rounded-[12px] bg-[#f7fafd] px-3 py-2.5"
              >
                <div className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#2e7dd2]" />
                <div className="text-[12px] leading-5 text-[#5f6f82]">{item}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
