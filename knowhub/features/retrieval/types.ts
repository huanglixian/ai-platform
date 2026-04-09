import type { StrategyHeadingMetadata } from "@/knowhub/features/strategies/types";

export interface RetrievalSearchItem {
  knowledgeId: string;
  filePath: string;
  fileName: string;
  headingTitle: string | null;
  parentHeadings: StrategyHeadingMetadata[];
  startLine: number;
  endLine: number;
  content: string;
  score: number;
}

export interface RetrievalSearchResult {
  query: string;
  knowledgeId: string;
  items: RetrievalSearchItem[];
}
