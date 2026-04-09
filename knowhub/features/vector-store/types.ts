export interface VectorRecordInput {
  knowledgeId: string;
  sourceKey: string;
  docspaceId: string;
  filePath: string;
  fileName: string;
  strategyId: string;
  sliceId: string;
  tokenCount: number;
  startLine: number;
  endLine: number;
  content: string;
  kind: string;
  headingTitle: string | null;
  parentHeadingsJson: string;
  embedding: number[];
}

export interface VectorSearchResult {
  rowId: number;
  distance: number;
  knowledgeId: string;
  sourceKey: string;
  docspaceId: string;
  filePath: string;
  fileName: string;
  strategyId: string;
  sliceId: string;
  tokenCount: number;
  startLine: number;
  endLine: number;
  content: string;
  kind: string;
  headingTitle: string | null;
  parentHeadingsJson: string;
}

export interface KnowledgeVectorStats {
  vectorCount: number;
}

export interface VectorStoreAdapter {
  replaceKnowledgeVectors: (
    knowledgeId: string,
    records: VectorRecordInput[],
  ) => KnowledgeVectorStats;
  deleteByKnowledgeId: (knowledgeId: string) => void;
  getKnowledgeStats: (knowledgeId: string) => KnowledgeVectorStats;
  searchByEmbedding: (
    knowledgeId: string,
    embedding: number[],
    limit: number,
  ) => VectorSearchResult[];
}
