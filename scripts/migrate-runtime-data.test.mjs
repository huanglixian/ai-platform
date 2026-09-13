import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import Database from "better-sqlite3";

test("启动时迁移 AppFactory 与应用中心运行数据", async () => {
  const originalDirectory = process.cwd();
  const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "ai-platform-data-layout-"));
  try {
    const legacyAppFactory = path.join(temporaryDirectory, "storage", "appfactory");
    await fs.mkdir(legacyAppFactory, { recursive: true });
    await fs.mkdir(path.join(temporaryDirectory, "storage", "agenthub"), { recursive: true });
    await fs.mkdir(path.join(temporaryDirectory, "storage", "knowhub"), { recursive: true });
    await fs.writeFile(path.join(temporaryDirectory, "storage", "agenthub", "agenthub.db"), "runtime");
    await fs.writeFile(path.join(temporaryDirectory, "storage", "knowhub", "demo.json"), "demo");

    const legacyPath = path.join(await fs.realpath(temporaryDirectory), "storage", "appfactory");
    const database = new Database(path.join(legacyAppFactory, "appfactory.db"));
    database.exec(`
      CREATE TABLE projects (workspace_path TEXT);
      CREATE TABLE sessions (transcript_path TEXT);
      CREATE TABLE publication_releases (artifact_path TEXT);
      CREATE TABLE publication_jobs (result_json TEXT);
    `);
    database.prepare("INSERT INTO projects VALUES (?)").run(path.join(legacyPath, "workspaces", "project-a"));
    database.prepare("INSERT INTO sessions VALUES (?)").run(path.join(legacyPath, "transcripts", "session-a.jsonl"));
    database.prepare("INSERT INTO publication_releases VALUES (?)").run(path.join(legacyPath, "releases", "project-a", "release-a"));
    database.prepare("INSERT INTO publication_jobs VALUES (?)").run(JSON.stringify({ artifactPath: path.join(legacyPath, "releases", "project-a", "release-a") }));
    database.close();

    process.chdir(temporaryDirectory);
    const { migrateRuntimeData } = await import("./migrate-runtime-data.mjs");
    assert.equal(migrateRuntimeData(), true);
    assert.equal(migrateRuntimeData(), false);

    const newAppFactory = path.join(process.cwd(), "data", "storage", "appfactory");
    const migrated = new Database(path.join(newAppFactory, "appfactory.db"), { readonly: true });
    assert.equal(migrated.prepare("SELECT workspace_path AS value FROM projects").get().value, path.join(newAppFactory, "workspaces", "project-a"));
    assert.equal(migrated.prepare("SELECT transcript_path AS value FROM sessions").get().value, path.join(newAppFactory, "transcripts", "session-a.jsonl"));
    assert.equal(migrated.prepare("SELECT artifact_path AS value FROM publication_releases").get().value, path.join(newAppFactory, "releases", "project-a", "release-a"));
    assert.match(migrated.prepare("SELECT result_json AS value FROM publication_jobs").get().value, /data\/storage\/appfactory/);
    migrated.close();
    await fs.access(path.join(temporaryDirectory, "data", "storage", "agenthub", "agenthub.db"));
    await fs.access(path.join(temporaryDirectory, "storage", "knowhub", "demo.json"));
  } finally {
    process.chdir(originalDirectory);
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
  }
});
