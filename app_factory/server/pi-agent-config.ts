import fs from "node:fs";
import path from "node:path";
import {
  getModelName,
  getModelProfile,
  getModelBaseUrl,
  getModelConfigurationError,
  ZHIPU_PAAS_BASE_URL,
} from "@/app_factory/server/model-profiles";
import { dataPaths } from "@/lib/data-paths";

const piAgentDirectory = dataPaths.appFactoryPiAgent;

export function createPiModelsConfig(environment: Record<string, string | undefined> = process.env) {
  const profile = getModelProfile("zhipu");
  const model = getModelName(profile, environment);
  const cockpit = getModelProfile("cockpit");
  const cockpitModel = getModelName(cockpit, environment);
  return {
    providers: {
      ...(!getModelConfigurationError(profile, environment) ? { "appfactory-zhipu": {
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
      } } : {}),
      ...(!getModelConfigurationError(cockpit, environment) ? {
        "appfactory-cockpit": {
          baseUrl: getModelBaseUrl(cockpit, environment),
          apiKey: "$APPFACTORY_COCKPIT_API_KEY",
          authHeader: true,
          api: "openai-responses",
          models: [{
            id: cockpitModel,
            name: cockpitModel,
            reasoning: true,
            thinkingLevelMap: { low: "low", medium: "medium", high: "high", xhigh: "xhigh", max: null },
            input: ["text", "image"],
            contextWindow: 1_050_000,
            maxTokens: 128_000,
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
          }],
        },
      } : {}),
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
