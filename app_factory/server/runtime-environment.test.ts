import assert from "node:assert/strict";
import test from "node:test";

// @ts-expect-error Node 测试直接加载 TypeScript 源文件。
import { isolateEnterpriseRuntimeEnvironment } from "./runtime-environment.ts";

test("企业应用保留运行密钥但不继承平台密钥", () => {
  const source = {
    NODE_ENV: "production" as const,
    DATABASE_URL: "postgres://example",
    APP_AUTH_SECRET: "application-secret",
    APPFACTORY_COCKPIT_API_KEY: "platform-secret",
    AGENT_HUB_BASE_URL: "http://localhost:19844",
  };
  const isolated = isolateEnterpriseRuntimeEnvironment(source);
  assert.equal(isolated.DATABASE_URL, source.DATABASE_URL);
  assert.equal(isolated.APP_AUTH_SECRET, source.APP_AUTH_SECRET);
  assert.equal(isolated.APPFACTORY_COCKPIT_API_KEY, undefined);
  assert.equal(isolated.AGENT_HUB_BASE_URL, undefined);
  assert.equal(source.APPFACTORY_COCKPIT_API_KEY, "platform-secret");
});
