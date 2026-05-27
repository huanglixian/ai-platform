export type ActiveModelConfig = {
  provider: "deepseek";
  apiKey: string;
  baseURL: string;
  model: string;
  thinkingType: "enabled" | "disabled";
  reasoningEffort: "high" | "max";
};
