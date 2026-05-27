import type { ActiveModelConfig } from "@/features/models/types";

const defaultDeepSeekBaseURL = "https://api.deepseek.com";
const defaultDeepSeekModel = "deepseek-v4-flash";

function readThinkingType() {
  const value = process.env.DEEPSEEK_THINKING_TYPE?.trim();
  return value === "disabled" ? "disabled" : "enabled";
}

function readReasoningEffort() {
  const value = process.env.DEEPSEEK_REASONING_EFFORT?.trim();
  return value === "max" ? "max" : "high";
}

export function getActiveModelConfig(): ActiveModelConfig {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim() || "";
  const baseURL = process.env.DEEPSEEK_BASE_URL?.trim() || defaultDeepSeekBaseURL;
  const model = process.env.DEEPSEEK_MODEL?.trim() || defaultDeepSeekModel;

  if (!apiKey || apiKey === "your_deepseek_api_key_here") {
    throw new Error("未配置 DEEPSEEK_API_KEY，无法调用工作台 AI 推荐。");
  }

  return {
    provider: "deepseek",
    apiKey,
    baseURL,
    model,
    thinkingType: readThinkingType(),
    reasoningEffort: readReasoningEffort(),
  };
}
