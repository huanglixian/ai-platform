import assert from "node:assert/strict";
import test from "node:test";

import { createPiModelsConfig } from "./pi-agent-config.ts";

test("智谱 Pi 配置使用 APPFACTORY_ZHIPU_MODEL", () => {
  const previousModel = process.env.APPFACTORY_ZHIPU_MODEL;
  process.env.APPFACTORY_ZHIPU_MODEL = "glm-5.3-flash-test";
  try {
    const config = createPiModelsConfig();
    assert.equal(config.providers["appfactory-zhipu"].models[0]?.id, "glm-5.3-flash-test");
  } finally {
    if (previousModel === undefined) delete process.env.APPFACTORY_ZHIPU_MODEL;
    else process.env.APPFACTORY_ZHIPU_MODEL = previousModel;
  }
});
