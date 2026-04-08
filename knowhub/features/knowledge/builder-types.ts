export type KnowledgeStageKey = "preprocess" | "chunking" | "extract";

export type KnowledgeFileTypeKey = "word" | "excel" | "pdfText" | "pdfImage";

export interface KnowledgeStrategyDraftItem {
  id: string;
  name: string;
  summary: string;
  enabled: boolean;
}

export interface KnowledgeStageDraft {
  key: KnowledgeStageKey;
  label: string;
  description: string;
  items: KnowledgeStrategyDraftItem[];
}

export interface KnowledgeFileTypeDraft {
  key: KnowledgeFileTypeKey;
  label: string;
  stages: KnowledgeStageDraft[];
}

export interface FolderStrategyDraft {
  id: string;
  docspaceId: string;
  docspaceName: string;
  path: string;
  fileTypes: KnowledgeFileTypeDraft[];
}
