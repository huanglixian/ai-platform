import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import Database from "better-sqlite3";

test("旧项目迁移为 Next.js 模板", async () => {
  const originalDirectory = process.cwd();
  const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "appfactory-migration-"));
  let database;
  try {
    await fs.symlink(path.join(originalDirectory, "app_factory"), path.join(temporaryDirectory, "app_factory"));
    await fs.symlink(path.join(originalDirectory, "lib"), path.join(temporaryDirectory, "lib"));
    const storagePath = path.join(temporaryDirectory, "data", "storage", "appfactory");
    await fs.mkdir(storagePath, { recursive: true });
    const legacy = new Database(path.join(storagePath, "appfactory.db"));
    legacy.exec("CREATE TABLE projects (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', skill_profile TEXT NOT NULL DEFAULT 'nextjs-build', workspace_path TEXT NOT NULL, published_port INTEGER, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)");
    legacy.prepare("INSERT INTO projects VALUES (?,?,?,?,?,?,?,?)").run(
      "legacy-project",
      "旧项目",
      "",
      "nextjs-build",
      "/tmp/legacy-project",
      null,
      "2026-01-01T00:00:00.000Z",
      "2026-01-01T00:00:00.000Z",
    );
    legacy.close();

    process.chdir(temporaryDirectory);
    const { getAppFactoryDatabase, getProject } = await import("./database.ts");
    database = getAppFactoryDatabase();
    const columns = database.prepare("PRAGMA table_info(projects)").all();
    assert.equal(columns.some((column) => column.name === "skill_profile"), false);
    assert.equal(columns.some((column) => column.name === "template_id"), true);
    assert.equal(getProject("legacy-project")?.template.id, "nextjs-app");
  } finally {
    database?.close();
    process.chdir(originalDirectory);
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
  }
});
