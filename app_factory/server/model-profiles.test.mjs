import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_MODEL_PROFILE_ID,
  DEFAULT_THINKING_LEVEL,
  getModelConfigurationError,
  getModelName,
  getModelProfile,
  isModelProfileId,
  isThinkingLevel,
  presentModelProfiles,
} from "./model-profiles.ts";

test("AppFactory 默认使用智谱档案和 high 思考", () => {
  assert.equal(DEFAULT_MODEL_PROFILE_ID, "zhipu");
  assert.equal(DEFAULT_THINKING_LEVEL, "high");
  assert.equal(isModelProfileId("deepseek"), true);
  assert.equal(isModelProfileId("codex"), false);
  assert.equal(isThinkingLevel("high"), true);
  assert.equal(isThinkingLevel("medium"), false);
});

test("模型档案要求各自的 AppFactory API Key 与模型名", () => {
  const glm = getModelProfile("zhipu");
  assert.equal(
    getModelConfigurationError(glm, {}),
    "未配置 APPFACTORY_ZHIPU_API_KEY，无法使用智谱 Coding。",
  );
  assert.equal(
    getModelConfigurationError(glm, { APPFACTORY_ZHIPU_API_KEY: "glm-key" }),
    "未配置 APPFACTORY_ZHIPU_MODEL，无法使用智谱 Coding。",
  );
  assert.equal(getModelName(glm, { APPFACTORY_ZHIPU_MODEL: "glm-5.3-flash" }), "glm-5.3-flash");
  assert.equal(
    getModelName(getModelProfile("deepseek"), { APPFACTORY_DEEPSEEK_MODEL: "deepseek-flash" }),
    "deepseek-flash",
  );
  const profiles = presentModelProfiles({
    APPFACTORY_ZHIPU_API_KEY: "glm-key",
    APPFACTORY_ZHIPU_MODEL: "glm-5.3-flash",
  });
  assert.equal(profiles[0]?.configured, true);
  assert.equal(profiles[1]?.configured, false);
});
