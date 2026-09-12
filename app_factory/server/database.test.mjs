import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

test("新建数据库使用稳定模型档案 ID", async () => {
  const originalDirectory = process.cwd();
  const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "appfactory-database-"));
  let database;
  try {
    await fs.symlink(path.join(originalDirectory, "app_factory"), path.join(temporaryDirectory, "app_factory"));
    process.chdir(temporaryDirectory);
    const { getAppFactoryDatabase } = await import("./database.ts");
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
  } finally {
    database?.close();
    process.chdir(originalDirectory);
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
  }
});
