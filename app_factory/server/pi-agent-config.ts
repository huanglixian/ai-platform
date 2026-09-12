import fs from "node:fs";
import path from "node:path";

import {
  getModelName,
  getModelProfile,
  ZHIPU_PAAS_BASE_URL,
} from "@/app_factory/server/model-profiles";

const piAgentDirectory = path.join(
  process.cwd(),
  "storage",
  "appfactory",
  "pi-agent",
);

export function createPiModelsConfig() {
  const profile = getModelProfile("zhipu");
  const model = getModelName(profile);
  return {
    providers: {
      "appfactory-zhipu": {
        baseUrl: ZHIPU_PAAS_BASE_URL,
        apiKey: "$APPFACTORY_ZHIPU_API_KEY",
        authHeader: true,
        api: "openai-completions",
        compat: {
          supportsStore: false,
          supportsDeveloperRole: false,
          supportsReasoningEffort: true,
          maxTokensField: "max_tokens",
          thinkingFormat: "zai",
          zaiToolStream: true,
          supportsStrictMode: false,
        },
        models: [
          {
            id: model,
            name: model,
            reasoning: true,
            thinkingLevelMap: {
              low: "low",
              high: "high",
              max: "max",
            },
            input: ["text"],
            contextWindow: 1_000_000,
            maxTokens: 131_072,
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
          },
        ],
      },
    },
  };
}

export function ensurePiAgentConfig() {
  fs.mkdirSync(piAgentDirectory, { recursive: true });
  fs.writeFileSync(
    path.join(piAgentDirectory, "models.json"),
    `${JSON.stringify(createPiModelsConfig(), null, 2)}\n`,
  );
  return piAgentDirectory;
}
