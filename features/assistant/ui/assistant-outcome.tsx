"use client";

import { Boxes, CodeXml, Home, Sparkles } from "lucide-react";
import Link from "next/link";

import type { AssistantChatOutcome, AssistantRecommendation } from "../chat-types";

const outcomePresentation = {
  application: { label: "应用", icon: Boxes, className: "bg-[#edf5fb] text-[#2772a5]" },
  skill: { label: "技能", icon: Sparkles, className: "bg-[#f2eef9] text-[#7656a4]" },
  service: { label: "业务 API", icon: CodeXml, className: "bg-[#eaf5f5] text-[#2b777f]" },
} as const;

function RecommendationAction({ item, onReturnHome }: { item: AssistantRecommendation; onReturnHome: () => void }) {
  const className = "mt-3 inline-flex h-7 items-center rounded-md border border-[#e8dcda] bg-white px-2.5 text-[11px] font-medium text-[#922c3b] transition-colors hover:border-[#d8b4ab] hover:bg-[#fcf7f4]";

  if (item.returnToHome) {
    return <button type="button" onClick={onReturnHome} className={className}>{item.actionLabel}</button>;
  }

  if (item.openInNewTab) {
    return <a href={item.href} target="_blank" rel="noreferrer" className={className}>{item.actionLabel} ↗</a>;
  }

  return <Link href={item.href} className={className}>{item.actionLabel}</Link>;
}

export function AssistantOutcome({ outcome, onReturnHome }: { outcome: AssistantChatOutcome; onReturnHome: () => void }) {
  if (outcome.type === "no_match") {
    return (
      <div className="mt-3 flex flex-wrap gap-2 border-t border-[#e7edf4] pt-3">
        <button type="button" onClick={onReturnHome} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#922c3b] px-3 text-[11px] font-medium text-white transition-colors hover:bg-[#70202e]"><Home size={13} />返回首页查看应用</button>
        <Link href="/skills" className="inline-flex h-8 items-center rounded-lg border border-[#e8dcda] bg-white px-3 text-[11px] font-medium text-[#836c69] transition-colors hover:border-[#d8b4ab] hover:text-[#8b293a]">查看技能中心</Link>
        <Link href="/services" className="inline-flex h-8 items-center rounded-lg border border-[#e8dcda] bg-white px-3 text-[11px] font-medium text-[#836c69] transition-colors hover:border-[#d8b4ab] hover:text-[#8b293a]">查看业务 API</Link>
      </div>
    );
  }

  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      {outcome.recommendations.map((item) => {
        const presentation = outcomePresentation[item.kind];
        const Icon = presentation.icon;
        return (
          <article key={`${item.kind}-${item.id}`} className="rounded-[10px] border border-[#e9ddda] bg-[#fcf8f5] p-3">
            <div className="flex items-start gap-2.5">
              <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${presentation.className}`}><Icon size={14} /></span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-medium text-[#a08d85]">{presentation.label}</span>
                  <span className="truncate text-[12px] font-semibold text-[#513437]">{item.name}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-[#887772]">{item.description}</p>
              </div>
            </div>
            <p className="mt-2 line-clamp-2 text-[11px] leading-4 text-[#836c69]">{item.reason}</p>
            <RecommendationAction item={item} onReturnHome={onReturnHome} />
          </article>
        );
      })}
    </div>
  );
}
