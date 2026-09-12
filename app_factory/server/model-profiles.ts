export const MODEL_PROFILE_IDS = [
  "zhipu",
  "deepseek",
] as const;

export const THINKING_LEVELS = ["low", "high", "max"] as const;

export type ModelProfileId = (typeof MODEL_PROFILE_IDS)[number];
export type ThinkingLevel = (typeof THINKING_LEVELS)[number];

export type AppFactoryModelProfile = {
  id: ModelProfileId;
  label: string;
  provider: string;
  description: string;
  piProvider: string;
  apiKeyEnv: string;
  piApiKeyEnv: string;
  modelEnv: string;
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
  },
];

export function isModelProfileId(value: unknown): value is ModelProfileId {
  return typeof value === "string" && MODEL_PROFILE_IDS.includes(value as ModelProfileId);
}

export function isThinkingLevel(value: unknown): value is ThinkingLevel {
  return typeof value === "string" && THINKING_LEVELS.includes(value as ThinkingLevel);
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
  return "";
}

export function presentModelProfiles(environment: Environment = process.env) {
  return modelProfiles.map((profile) => ({
    id: profile.id,
    label: profile.label,
    provider: profile.provider,
    description: profile.description,
    model: getModelName(profile, environment),
    configured: Boolean(getModelApiKey(profile, environment) && getModelName(profile, environment)),
  }));
}
