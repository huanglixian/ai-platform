import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

import { getActiveModelConfig } from "@/features/models/env";

export function getActiveLanguageModel() {
  const config = getActiveModelConfig();
  const provider = createOpenAICompatible({
    name: config.provider,
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    includeUsage: true,
  });

  return provider(config.model);
}
