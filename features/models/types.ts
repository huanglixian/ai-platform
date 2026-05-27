import type { LanguageModel, streamText } from "ai";

type StreamTextOptions = Parameters<typeof streamText>[0];

export type ActiveModelConfig = {
  provider: "deepseek";
  apiKey: string;
  baseURL: string;
  model: string;
  thinkingType: "enabled" | "disabled";
  reasoningEffort: "high" | "max";
};

export type ActiveModelRuntime = {
  model: LanguageModel;
  providerOptions: StreamTextOptions["providerOptions"];
};
