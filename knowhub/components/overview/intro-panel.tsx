type IntroPanelProps = {
  title: string;
  description: string;
};

export function IntroPanel({
  title,
  description,
}: IntroPanelProps) {
  return (
    <section className="overflow-hidden rounded-[16px] border border-[#dbe5f0] bg-[linear-gradient(135deg,rgba(239,245,251,0.96)_0%,rgba(255,255,255,0.98)_52%,rgba(246,249,253,0.96)_100%)] shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
      <div className="px-5 py-4.5">
        <div className="space-y-1">
          <h2 className="text-title text-[26px] font-semibold tracking-[-0.03em]">
            {title}
          </h2>
          <p className="max-w-[680px] text-[14px] leading-7 text-[#667085]">
            {description}
          </p>
        </div>
      </div>
    </section>
  );
}
