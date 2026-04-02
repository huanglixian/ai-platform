export type StrategyCategory = "preprocess" | "chunking" | "extract";

export interface StrategyRecord {
  id: string;
  name: string;
  category: StrategyCategory;
  group: string;
  summary: string;
  metaLabel: string;
  metaValue: string;
  owner: string;
  usageCount: number;
}
