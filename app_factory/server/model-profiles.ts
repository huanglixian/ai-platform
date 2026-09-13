import {
  MODEL_PROFILE_IDS,
  type ModelProfileId,
  type ThinkingLevel,
  type ThinkingLevelsByProfile,
  type ModelProfileSummary,
} from "../types/model";
export { MODEL_PROFILE_IDS };
export type { ModelProfileId, ThinkingLevel } from "../types/model";

export type AppFactoryModelProfile = {
  id: ModelProfileId;
  label: string;
  provider: string;
  description: string;
  piProvider: string;
  apiKeyEnv: string;
  piApiKeyEnv: string;
  modelEnv: string;
  baseUrlEnv?: string;
  thinkingLevels: readonly ThinkingLevel[];
};

type Environment = Record<string, string | undefined>;

export const DEFAULT_MODEL_PROFILE_ID: ModelProfileId = "zhipu";
export const DEFAULT_THINKING_LEVEL: ThinkingLevel = "high";
export const ZHIPU_PAAS_BASE_URL = "https://open.bigmodel.cn/api/paas/v4";

const modelProfiles: readonly AppFactoryModelProfile[] = [
  {
    id: "zhipu",
    label: "智谱 Coding",
    provider: "智谱 PaaS",
    description: "适合日常应用开发与多步骤编码任务。",
    piProvider: "appfactory-zhipu",
    apiKeyEnv: "APPFACTORY_ZHIPU_API_KEY",
    piApiKeyEnv: "APPFACTORY_ZHIPU_API_KEY",
    modelEnv: "APPFACTORY_ZHIPU_MODEL",
    thinkingLevels: ["low", "high", "max"],
  },
  {
    id: "deepseek",
    label: "DeepSeek Coding",
    provider: "DeepSeek",
    description: "适合快速代码开发任务。",
    piProvider: "deepseek",
    apiKeyEnv: "APPFACTORY_DEEPSEEK_API_KEY",
    piApiKeyEnv: "DEEPSEEK_API_KEY",
    modelEnv: "APPFACTORY_DEEPSEEK_MODEL",
    thinkingLevels: ["low", "high", "max"],
  },
  {
    id: "cockpit",
    label: "Cockpit Coding",
    provider: "Cockpit",
    description: "通过 Cockpit Responses API 使用编码模型。",
    piProvider: "appfactory-cockpit",
    apiKeyEnv: "APPFACTORY_COCKPIT_API_KEY",
    piApiKeyEnv: "APPFACTORY_COCKPIT_API_KEY",
    modelEnv: "APPFACTORY_COCKPIT_MODEL",
    baseUrlEnv: "APPFACTORY_COCKPIT_BASE_URL",
    thinkingLevels: ["low", "medium", "high", "xhigh"],
  },
];

export function isModelProfileId(value: unknown): value is ModelProfileId {
  return typeof value === "string" && MODEL_PROFILE_IDS.includes(value as ModelProfileId);
}

export function isThinkingLevel(profileId: ModelProfileId, value: unknown): value is ThinkingLevel {
  return typeof value === "string" && getModelProfile(profileId).thinkingLevels.includes(value as ThinkingLevel);
}

export function defaultThinkingLevels(): ThinkingLevelsByProfile {
  return { zhipu: DEFAULT_THINKING_LEVEL, deepseek: DEFAULT_THINKING_LEVEL, cockpit: DEFAULT_THINKING_LEVEL };
}

export function isThinkingLevelsByProfile(value: unknown): value is ThinkingLevelsByProfile {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const levels = value as Record<string, unknown>;
  return Object.keys(levels).length === MODEL_PROFILE_IDS.length &&
    MODEL_PROFILE_IDS.every((id) => isThinkingLevel(id, levels[id]));
}

export function getModelProfile(id: ModelProfileId): AppFactoryModelProfile {
  const profile = modelProfiles.find((item) => item.id === id);
  if (!profile) throw new Error(`未知模型档案：${id}`);
  return profile;
}

export function getModelApiKey(
  profile: AppFactoryModelProfile,
  environment: Environment = process.env,
) {
  return environment[profile.apiKeyEnv]?.trim() || "";
}

export function getModelName(
  profile: AppFactoryModelProfile,
  environment: Environment = process.env,
) {
  return environment[profile.modelEnv]?.trim() || "";
}

export function getModelConfigurationError(
  profile: AppFactoryModelProfile,
  environment: Environment = process.env,
) {
  if (!getModelApiKey(profile, environment)) {
    return `未配置 ${profile.apiKeyEnv}，无法使用${profile.label}。`;
  }
  if (!getModelName(profile, environment)) {
    return `未配置 ${profile.modelEnv}，无法使用${profile.label}。`;
  }
  if (profile.baseUrlEnv) {
    try {
      const url = new URL(getModelBaseUrl(profile, environment));
      if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
        throw new Error("无效服务地址");
      }
    } catch {
      return `${profile.baseUrlEnv} 必须配置为不含凭证、查询参数或片段的 HTTP(S) API 地址。`;
    }
  }
  return "";
}

export function getModelBaseUrl(profile: AppFactoryModelProfile, environment: Environment = process.env) {
  return profile.baseUrlEnv ? (environment[profile.baseUrlEnv]?.trim() || "").replace(/\/+$/, "") : "";
}

export function presentModelProfiles(environment: Environment = process.env): ModelProfileSummary[] {
  return modelProfiles.map((profile) => ({
    id: profile.id,
    label: profile.label,
    provider: profile.provider,
    description: profile.description,
    model: getModelName(profile, environment),
    configured: !getModelConfigurationError(profile, environment),
    thinkingLevels: profile.thinkingLevels,
  }));
}
