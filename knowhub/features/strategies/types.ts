export type StrategyCategory = "preprocess" | "chunking" | "extract";

export type StrategySettingValue = boolean | number | string | number[];

export type StrategySettingFieldType = "boolean" | "number" | "text" | "number-array";

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

export interface StrategySettingDefinition {
  key: string;
  label: string;
  type: StrategySettingFieldType;
  description: string;
  defaultValue: StrategySettingValue;
}

export interface StrategyTemplateDefinition {
  id: string;
  name: string;
  category: StrategyCategory;
  group: string;
  summary: string;
  metaLabel: string;
  metaValue: string;
  owner: string;
  defaultPresetName: string;
  settings: StrategySettingDefinition[];
}

export interface StrategyPresetRecord {
  id: string;
  templateId: string;
  name: string;
  readonly: boolean;
  values: Record<string, StrategySettingValue>;
  createdAt: string;
  updatedAt: string;
}

export interface StrategyHeadingMetadata {
  title: string;
  level: number;
}

export interface StrategySliceRange {
  startLine: number;
  endLine: number;
}

export type StrategySliceKind = "plain" | "heading";

export interface StrategyTestSlice {
  id: string;
  content: string;
  tokenCount: number;
  kind: StrategySliceKind;
  heading?: StrategyHeadingMetadata;
  parentHeadings: StrategyHeadingMetadata[];
  range: StrategySliceRange;
}

export interface StrategyTestResult {
  sliceCount: number;
  slices: StrategyTestSlice[];
}

export interface StrategyPresetStore {
  items: StrategyPresetRecord[];
}
