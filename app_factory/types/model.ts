export const MODEL_PROFILE_IDS = ["zhipu", "deepseek", "cockpit"] as const;
export type ModelProfileId = (typeof MODEL_PROFILE_IDS)[number];
export type ThinkingLevel = "low" | "medium" | "high" | "xhigh" | "max";
export type ThinkingLevelsByProfile = Record<ModelProfileId, ThinkingLevel>;

export type ModelProfileSummary = {
  id: ModelProfileId;
  label: string;
  provider: string;
  description: string;
  model: string;
  configured: boolean;
  thinkingLevels: readonly ThinkingLevel[];
};

export type ModelSettingsInput = {
  defaultModelProfileId: ModelProfileId;
  thinkingLevels: ThinkingLevelsByProfile;
};

export type ModelSettings = ModelSettingsInput & {
  profiles: ModelProfileSummary[];
};
