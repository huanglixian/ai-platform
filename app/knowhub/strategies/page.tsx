import { KnowHubStrategiesPage } from "@/knowhub/components/strategies/strategies-page";
import type { StrategyCategory } from "@/knowhub/features/strategies/types";

type KnowHubStrategiesRoutePageProps = {
  searchParams: Promise<{
    tab?: string;
  }>;
};

function normalizeTab(tab?: string): StrategyCategory {
  if (tab === "chunking" || tab === "extract") {
    return tab;
  }

  return "preprocess";
}

export default async function KnowHubStrategiesRoutePage({
  searchParams,
}: KnowHubStrategiesRoutePageProps) {
  const { tab } = await searchParams;

  return <KnowHubStrategiesPage activeCategory={normalizeTab(tab)} />;
}
