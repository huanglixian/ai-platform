import assert from "node:assert/strict";
import test from "node:test";

import { createPiModelsConfig } from "./pi-agent-config.ts";
import { createPiRunArgs } from "../features/pi-harness.ts";
import { streamSimple } from "../../node_modules/@earendil-works/pi-coding-agent/node_modules/@earendil-works/pi-ai/dist/api/openai-responses.js";

test("智谱 Pi 配置保留 PaaS Chat Completions，未配置的 Cockpit 不注册", () => {
  const config = createPiModelsConfig({ APPFACTORY_ZHIPU_MODEL: "glm-5.3-flash-test", APPFACTORY_ZHIPU_API_KEY: "test" });
  assert.equal(config.providers["appfactory-zhipu"].models[0]?.id, "glm-5.3-flash-test");
  assert.equal(config.providers["appfactory-zhipu"].api, "openai-completions");
  assert.equal(config.providers["appfactory-zhipu"].baseUrl, "https://open.bigmodel.cn/api/paas/v4");
  assert.equal(config.providers["appfactory-cockpit"], undefined);
});

test("PI 启动参数按档案校验，不允许 Cockpit max 或智谱 xhigh", () => {
  const session = { id: "test-session", projectId: "test-project", harness: "pi", cwd: "/tmp" };
  for (const level of ["low", "medium", "high", "xhigh"]) {
    const args = createPiRunArgs(session, "测试", { modelProfileId: "cockpit", thinkingLevel: level, templateId: "static-html" });
    assert.equal(args[args.indexOf("--thinking") + 1], level);
    assert.equal(args[args.indexOf("--provider") + 1], "appfactory-cockpit");
  }
  for (const [modelProfileId, thinkingLevel] of [["cockpit", "max"], ["zhipu", "xhigh"], ["deepseek", "xhigh"]]) {
    assert.throws(() => createPiRunArgs(session, "测试", { modelProfileId, thinkingLevel, templateId: "static-html" }), /不支持/);
  }
});

test("PI Responses 适配器原样发送四档思考程度并解析流式工具调用", async () => {
  const provider = createPiModelsConfig({
    APPFACTORY_COCKPIT_MODEL: "gpt-5.6-terra",
    APPFACTORY_COCKPIT_API_KEY: "test",
    APPFACTORY_COCKPIT_BASE_URL: "http://localhost:52611/v1",
  }).providers["appfactory-cockpit"];
  const model = { ...provider.models[0], api: provider.api, baseUrl: provider.baseUrl, provider: "appfactory-cockpit" };
  for (const reasoning of ["low", "medium", "high", "xhigh"]) {
    let request;
    const tool = { type: "function_call", id: "fc_test", call_id: "call_test", name: "read", arguments: '{"path":"index.html"}' };
    const events = [
      { type: "response.output_item.added", output_index: 0, item: { ...tool, arguments: "" } },
      { type: "response.function_call_arguments.delta", output_index: 0, delta: tool.arguments },
      { type: "response.output_item.done", output_index: 0, item: tool },
      { type: "response.completed", response: {
      id: "resp_test", status: "completed",
      output: [tool],
      usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15 },
    } }];
    const result = await streamSimple(model, {
      messages: [{ role: "user", content: "读取文件", timestamp: Date.now() }],
      tools: [{ name: "read", description: "读取文件", parameters: { type: "object", properties: { path: { type: "string" } }, required: ["path"] } }],
    }, {
      apiKey: "test", reasoning,
      fetch: async (url, init) => {
        request = JSON.parse(init.body);
        assert.equal(String(url), "http://localhost:52611/v1/responses");
        return new Response(events.map((event) => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join(""), { headers: { "content-type": "text/event-stream" } });
      },
    }).result();
    assert.equal(request.model, "gpt-5.6-terra");
    assert.equal(request.reasoning.effort, reasoning);
    assert.equal(request.stream, true);
    assert.equal(request.tools[0].name, "read");
    assert.equal(result.stopReason, "toolUse");
    assert.equal(result.content[0].type, "toolCall");
    assert.deepEqual(result.content[0].arguments, { path: "index.html" });
  }
});

test("Cockpit 使用 Responses 和环境变量引用，不写入密钥", () => {
  const config = createPiModelsConfig({
    APPFACTORY_COCKPIT_MODEL: "gpt-5.6-terra",
    APPFACTORY_COCKPIT_API_KEY: "test-secret",
    APPFACTORY_COCKPIT_BASE_URL: "http://localhost:52611/v1/",
  });
  const provider = config.providers["appfactory-cockpit"];
  assert.equal(provider.api, "openai-responses");
  assert.equal(provider.baseUrl, "http://localhost:52611/v1");
  assert.equal(provider.apiKey, "$APPFACTORY_COCKPIT_API_KEY");
  assert.equal(provider.models[0].id, "gpt-5.6-terra");
  assert.equal(provider.models[0].thinkingLevelMap.xhigh, "xhigh");
  assert.equal(provider.models[0].thinkingLevelMap.max, null);
  assert.equal(config.providers["appfactory-zhipu"], undefined);
  assert.equal(JSON.stringify(config).includes("test-secret"), false);
  assert.deepEqual(createPiModelsConfig({}).providers, {});
});
