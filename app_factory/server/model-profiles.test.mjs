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
  defaultThinkingLevels,
  isThinkingLevelsByProfile,
} from "./model-profiles.ts";

test("AppFactory 默认使用智谱档案和 high 思考", () => {
  assert.equal(DEFAULT_MODEL_PROFILE_ID, "zhipu");
  assert.equal(DEFAULT_THINKING_LEVEL, "high");
  assert.equal(isModelProfileId("deepseek"), true);
  assert.equal(isModelProfileId("codex"), false);
  assert.equal(isThinkingLevel("zhipu", "high"), true);
  assert.equal(isThinkingLevel("zhipu", "medium"), false);
});

test("各档案独立限制思考档位，Cockpit 不开放 max", () => {
  assert.deepEqual(getModelProfile("cockpit").thinkingLevels, ["low", "medium", "high", "xhigh"]);
  for (const id of ["zhipu", "deepseek"]) {
    assert.equal(isThinkingLevel(id, "xhigh"), false);
    assert.equal(isThinkingLevel(id, "max"), true);
  }
  const levels = defaultThinkingLevels();
  assert.equal(levels.cockpit, "high");
  levels.cockpit = "xhigh";
  assert.equal(isThinkingLevelsByProfile(levels), true);
  assert.equal(levels.zhipu, "high");
  assert.equal(isThinkingLevelsByProfile({ ...levels, cockpit: "max" }), false);
  assert.equal(isThinkingLevelsByProfile({ ...levels, zhipu: "xhigh" }), false);
  assert.equal(isThinkingLevelsByProfile({ zhipu: "high" }), false);
  assert.equal(isThinkingLevelsByProfile({ ...levels, other: "high" }), false);
});

test("Cockpit 要求独立密钥、模型和有效地址，公开配置不包含密钥", () => {
  const profile = getModelProfile("cockpit");
  const env = {
    APPFACTORY_COCKPIT_API_KEY: "test-secret",
    APPFACTORY_COCKPIT_MODEL: "gpt-5.6-terra",
    APPFACTORY_COCKPIT_BASE_URL: "http://localhost:52611/v1",
  };
  assert.equal(getModelConfigurationError(profile, env), "");
  for (const field of Object.keys(env)) {
    assert.notEqual(getModelConfigurationError(profile, { ...env, [field]: "" }), "");
  }
  for (const url of ["ftp://example.com", "http://user:pass@localhost/v1", "http://localhost/v1?key=test"]) {
    assert.notEqual(getModelConfigurationError(profile, { ...env, APPFACTORY_COCKPIT_BASE_URL: url }), "");
  }
  assert.equal(JSON.stringify(presentModelProfiles(env)).includes("test-secret"), false);
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
