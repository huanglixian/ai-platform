import {
  BookOpenText,
  Database,
  FileText,
  FolderKanban,
  Search,
  SlidersHorizontal,
  Link2,
  FolderPlus,
  Scissors,
} from "lucide-react";

import { KnowHubPageShell } from "@/knowhub/components/layout/knowhub-page-shell";
import { FlowStageCard } from "@/knowhub/components/overview/flow-stage-card";
import { IntroPanel } from "@/knowhub/components/overview/intro-panel";
import { StatCard } from "@/knowhub/components/overview/stat-card";
import {
  buildKnowHubFlowStages,
  knowHubOverviewIntro,
  buildKnowHubOverviewStats,
} from "@/knowhub/features/overview/data";
import type { DocSpaceRecord } from "@/knowhub/features/docspaces/types";

const statIconMap = {
  docspaces: FolderKanban,
  documents: FileText,
  strategies: SlidersHorizontal,
  knowledge: BookOpenText,
  retrieval: Search,
} as const;

const statAccentMap = {
  docspaces: "#0368b3",
  documents: "#2e7dd2",
  strategies: "#d08a33",
  knowledge: "#1f8a57",
  retrieval: "#8a5ac2",
} as const;

const flowIconMap = {
  docspace: FolderPlus,
  source: Link2,
  preprocess: SlidersHorizontal,
  chunking: Scissors,
  knowledge: BookOpenText,
  retrieval: Database,
} as const;

const flowAccentMap = {
  docspace: "#0368b3",
  source: "#2e7dd2",
  preprocess: "#d08a33",
  chunking: "#1f8a57",
  knowledge: "#6f96c4",
  retrieval: "#8a5ac2",
} as const;

type KnowHubOverviewPageProps = {
  docspaces: DocSpaceRecord[];
};

export function KnowHubOverviewPage({
  docspaces,
}: KnowHubOverviewPageProps) {
  const knowHubOverviewStats = buildKnowHubOverviewStats(docspaces);
  const knowHubFlowStages = buildKnowHubFlowStages(docspaces.length);

  return (
    <KnowHubPageShell>
      <IntroPanel
        title={knowHubOverviewIntro.title}
        description={knowHubOverviewIntro.description}
      />

      <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        {knowHubOverviewStats.map((item) => {
          const Icon = statIconMap[item.key as keyof typeof statIconMap];
          const accent = statAccentMap[item.key as keyof typeof statAccentMap];

          return (
            <StatCard
              key={item.key}
              label={item.label}
              value={item.value}
              hint={item.hint}
              icon={Icon}
              accent={accent}
            />
          );
        })}
      </section>

      <section className="rounded-[16px] border border-[#dbe5f0] bg-white px-4.5 py-4.5 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
        <div className="mb-2 flex items-end justify-between gap-4">
          <div>
            <div className="text-title text-[18px] font-semibold tracking-[-0.02em]">
              知识处理流程
            </div>
            <div className="mt-0.5 text-[12px] leading-5 text-[#667085]">
              从 DocSpace 建立到知识内容沉淀，围绕统一流程组织知识资产。
            </div>
          </div>
        </div>
        <div className="grid gap-1.5 md:grid-cols-2 xl:grid-cols-3">
          {knowHubFlowStages.map((item, index) => {
            const Icon = flowIconMap[item.key as keyof typeof flowIconMap];
            const accent = flowAccentMap[item.key as keyof typeof flowAccentMap];

            return (
              <div key={item.key}>
                <FlowStageCard
                  title={item.title}
                  summary={item.summary}
                  metric={item.metric}
                  icon={Icon}
                  accent={accent}
                  index={index + 1}
                />
              </div>
            );
          })}
        </div>
      </section>
    </KnowHubPageShell>
  );
}
