import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

import { getActiveModelConfig } from "@/features/models/env";
import type { ActiveModelRuntime } from "@/features/models/types";

export function getActiveModelRuntime(): ActiveModelRuntime {
  const config = getActiveModelConfig();
  const provider = createOpenAICompatible({
    name: config.provider,
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    includeUsage: true,
  });

  return {
    model: provider(config.model),
    providerOptions: {
      deepseek: {
        reasoningEffort: config.reasoningEffort,
        thinking: {
          type: config.thinkingType,
        },
      },
    },
  };
}
