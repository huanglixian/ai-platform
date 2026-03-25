type PagePlaceholderProps = {
  text: string;
};

export function PagePlaceholder({ text }: PagePlaceholderProps) {
  return (
    <div className="rounded-[10px] border border-dashed border-[#d5e0eb] bg-[rgba(255,255,255,0.88)] px-8 py-12 text-center text-[15px] leading-7 text-[#667085] shadow-[0_6px_18px_rgba(15,23,42,0.03)]">
      {text}
    </div>
  );
}
