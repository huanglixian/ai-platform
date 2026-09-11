import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_MODEL_PROFILE_ID,
  DEFAULT_THINKING_LEVEL,
  getModelConfigurationError,
  getModelProfile,
  isModelProfileId,
  isThinkingLevel,
  presentModelProfiles,
} from "./model-profiles.ts";

test("AppFactory 默认使用 GLM-5.3-Flash 和 high 思考", () => {
  assert.equal(DEFAULT_MODEL_PROFILE_ID, "glm-5.3-flash");
  assert.equal(DEFAULT_THINKING_LEVEL, "high");
  assert.equal(isModelProfileId("deepseek-v4-flash"), true);
  assert.equal(isModelProfileId("codex"), false);
  assert.equal(isThinkingLevel("high"), true);
  assert.equal(isThinkingLevel("medium"), false);
});

test("模型档案只依赖各自的 AppFactory API Key", () => {
  const glm = getModelProfile("glm-5.3-flash");
  assert.equal(
    getModelConfigurationError(glm, {}),
    "未配置 APPFACTORY_ZHIPU_API_KEY，无法使用GLM-5.3-Flash。",
  );
  const profiles = presentModelProfiles({
    APPFACTORY_ZHIPU_API_KEY: "glm-key",
  });
  assert.equal(profiles[0]?.configured, true);
  assert.equal(profiles[1]?.configured, false);
});
