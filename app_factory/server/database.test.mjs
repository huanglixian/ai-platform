import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { createRequire, registerHooks } from "node:module";

test("新建数据库使用稳定模型档案 ID", async () => {
  const originalDirectory = process.cwd();
  const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "appfactory-database-"));
  let database;
  const require = createRequire(import.meta.url);
  const nextResolution = registerHooks({ resolve(specifier, context, nextResolve) {
    if (specifier === "next/server") return { url: pathToFileURL(require.resolve(specifier)).href, shortCircuit: true };
    return nextResolve(specifier, context);
  } });
  try {
    await fs.symlink(path.join(originalDirectory, "app_factory"), path.join(temporaryDirectory, "app_factory"));
    await fs.symlink(path.join(originalDirectory, "lib"), path.join(temporaryDirectory, "lib"));
    await fs.symlink(path.join(originalDirectory, "node_modules"), path.join(temporaryDirectory, "node_modules"));
    process.chdir(temporaryDirectory);
    const {
      createProject,
      createRun,
      createSession,
      finishRun,
      getActiveRunForSession,
      getAppFactoryDatabase,
      getRun,
      getAppFactoryModelSettings,
      updateAppFactoryModelSettings,
    } = await import(pathToFileURL(path.join(temporaryDirectory, "app_factory/server/database.ts")).href);
    database = getAppFactoryDatabase();
    const columns = database.prepare("PRAGMA table_info(sessions)").all();
    const modelProfileColumn = columns.find((column) => column.name === "model_profile_id");
    const titleColumn = columns.find((column) => column.name === "title");

    assert.equal(modelProfileColumn?.dflt_value, "'zhipu'");
    assert.equal(titleColumn?.dflt_value, "'新对话'");
    assert.equal(
      database.prepare("SELECT default_model_profile AS profile FROM appfactory_settings WHERE id = 1").get().profile,
      "zhipu",
    );
    const project = createProject({
      name: "纯 HTML 测试项目",
      templateId: "static-html",
    });
    assert.equal(project.templateId, "static-html");
    assert.equal(project.template.name, "纯 HTML 应用");
    assert.match(
      await fs.readFile(path.join(project.workspacePath, "app.yaml"), "utf8"),
      /runtime: static-web/,
    );
    const session = createSession(project.id);
    const initialSettings = getAppFactoryModelSettings();
    assert.deepEqual(initialSettings.thinkingLevels, { zhipu: "high", deepseek: "high", cockpit: "high" });
    updateAppFactoryModelSettings({ defaultModelProfileId: "cockpit", thinkingLevels: { zhipu: "max", deepseek: "low", cockpit: "xhigh" } });
    assert.equal(createSession(project.id).modelProfileId, "cockpit");
    assert.equal(session.modelProfileId, "zhipu");
    assert.deepEqual(getAppFactoryModelSettings().thinkingLevels, { zhipu: "max", deepseek: "low", cockpit: "xhigh" });
    assert.throws(() => updateAppFactoryModelSettings({ defaultModelProfileId: "cockpit", thinkingLevels: { zhipu: "high", deepseek: "high", cockpit: "max" } }), /设置无效/);
    assert.equal(getAppFactoryModelSettings().thinkingLevels.cockpit, "xhigh");
    const { GET, PUT } = await import("../../app/api/appfactory/v1/settings/model/route.ts");
    const response = await GET();
    const payload = await response.json();
    assert.deepEqual(payload.data.profiles.find((profile) => profile.id === "cockpit").thinkingLevels, ["low", "medium", "high", "xhigh"]);
    for (const thinkingLevels of [
      { zhipu: "max", deepseek: "low", cockpit: "max" },
      { zhipu: "xhigh", deepseek: "low", cockpit: "high" },
      { zhipu: "high", deepseek: "xhigh", cockpit: "high" },
    ]) {
      const rejected = await PUT(new Request("http://localhost/api/settings", { method: "PUT", body: JSON.stringify({ defaultModelProfileId: "cockpit", thinkingLevels }) }));
      assert.equal(rejected.status, 422);
    }
    const saved = await PUT(new Request("http://localhost/api/settings", { method: "PUT", body: JSON.stringify({ defaultModelProfileId: "deepseek", thinkingLevels: { zhipu: "max", deepseek: "low", cockpit: "medium" } }) }));
    assert.equal(saved.status, 200);
    assert.deepEqual(getAppFactoryModelSettings().thinkingLevels, { zhipu: "max", deepseek: "low", cockpit: "medium" });
    const run = createRun(project.id, session.id, "创建欢迎页");
    assert.equal(getActiveRunForSession(session.id)?.id, run.id);
    assert.equal(getRun(run.id)?.createdAt, run.createdAt);
    finishRun(run.id, "cancelled", "任务已取消");
    assert.equal(getActiveRunForSession(session.id), null);
    assert.equal(getRun(run.id)?.status, "cancelled");
  } finally {
    nextResolution.deregister();
    database?.close();
    process.chdir(originalDirectory);
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
  }
});
