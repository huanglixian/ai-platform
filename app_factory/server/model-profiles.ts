export const MODEL_PROFILE_IDS = [
  "glm-5.3-flash",
  "deepseek-v4-flash",
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
  model: string;
  apiKeyEnv: string;
};

type Environment = Record<string, string | undefined>;

export const DEFAULT_MODEL_PROFILE_ID: ModelProfileId = "glm-5.3-flash";
export const DEFAULT_THINKING_LEVEL: ThinkingLevel = "high";
export const ZHIPU_PAAS_BASE_URL = "https://open.bigmodel.cn/api/paas/v4";

const modelProfiles: readonly AppFactoryModelProfile[] = [
  {
    id: "glm-5.3-flash",
    label: "GLM-5.3-Flash",
    provider: "智谱 PaaS",
    description: "适合日常应用开发与多步骤编码任务。",
    piProvider: "appfactory-zhipu",
    model: "glm-5.3-flash",
    apiKeyEnv: "APPFACTORY_ZHIPU_API_KEY",
  },
  {
    id: "deepseek-v4-flash",
    label: "DeepSeek V4 Flash",
    provider: "DeepSeek",
    description: "保留为快速代码开发的可切换模型。",
    piProvider: "deepseek",
    model: "deepseek-v4-flash",
    apiKeyEnv: "APPFACTORY_DEEPSEEK_API_KEY",
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

export function getModelConfigurationError(
  profile: AppFactoryModelProfile,
  environment: Environment = process.env,
) {
  return getModelApiKey(profile, environment)
    ? ""
    : `未配置 ${profile.apiKeyEnv}，无法使用${profile.label}。`;
}

export function presentModelProfiles(environment: Environment = process.env) {
  return modelProfiles.map((profile) => ({
    id: profile.id,
    label: profile.label,
    provider: profile.provider,
    description: profile.description,
    configured: Boolean(getModelApiKey(profile, environment)),
  }));
}
