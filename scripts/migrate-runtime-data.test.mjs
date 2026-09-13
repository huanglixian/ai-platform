import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import Database from "better-sqlite3";

function createAgentHubDatabase(filePath, rows) {
  const database = new Database(filePath);
  database.exec(`
    CREATE TABLE applications (id TEXT PRIMARY KEY, name TEXT NOT NULL);
    CREATE TABLE capabilities (id TEXT PRIMARY KEY, name TEXT NOT NULL);
    CREATE TABLE workflows (id TEXT PRIMARY KEY, name TEXT NOT NULL);
  `);
  for (const [tableName, items] of Object.entries(rows)) {
    const insert = database.prepare(`INSERT INTO ${tableName} (id, name) VALUES (?, ?)`);
    for (const item of items) insert.run(item.id, item.name);
  }
  database.close();
}

test("启动时恢复旧运行数据并保留已经初始化的新存储", async () => {
  const originalDirectory = process.cwd();
  const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "ai-platform-data-layout-"));
  try {
    const legacyRoot = path.join(temporaryDirectory, "storage");
    const legacyAppFactory = path.join(legacyRoot, "appfactory");
    const legacyAgentHub = path.join(legacyRoot, "agenthub");
    const legacyKnowHub = path.join(legacyRoot, "knowhub");
    await fs.mkdir(legacyAppFactory, { recursive: true });
    await fs.mkdir(legacyAgentHub, { recursive: true });
    await fs.mkdir(path.join(legacyKnowHub, "docspace", "hosted", "docspace-a", "raw"), { recursive: true });
    await fs.mkdir(path.join(legacyKnowHub, "knowledge"), { recursive: true });
    await fs.mkdir(path.join(legacyKnowHub, "vector"), { recursive: true });

    const legacyStorageRoot = path.join(await fs.realpath(temporaryDirectory), "storage");
    const legacyPath = path.join(legacyStorageRoot, "appfactory");
    const legacyKnowHubPath = path.join(legacyStorageRoot, "knowhub");
    const appFactoryDatabase = new Database(path.join(legacyAppFactory, "appfactory.db"));
    appFactoryDatabase.exec(`
      CREATE TABLE projects (workspace_path TEXT);
      CREATE TABLE sessions (transcript_path TEXT);
      CREATE TABLE publication_releases (artifact_path TEXT);
      CREATE TABLE publication_jobs (result_json TEXT);
    `);
    appFactoryDatabase.prepare("INSERT INTO projects VALUES (?)").run(path.join(legacyPath, "workspaces", "project-a"));
    appFactoryDatabase.prepare("INSERT INTO sessions VALUES (?)").run(path.join(legacyPath, "transcripts", "session-a.jsonl"));
    appFactoryDatabase.prepare("INSERT INTO publication_releases VALUES (?)").run(path.join(legacyPath, "releases", "project-a", "release-a"));
    appFactoryDatabase.prepare("INSERT INTO publication_jobs VALUES (?)").run(JSON.stringify({ artifactPath: path.join(legacyPath, "releases", "project-a", "release-a") }));
    appFactoryDatabase.close();

    createAgentHubDatabase(path.join(legacyAgentHub, "agenthub.db"), {
      applications: [{ id: "legacy-app", name: "旧发布应用" }],
      capabilities: [{ id: "legacy-capability", name: "旧能力" }],
      workflows: [{ id: "legacy-workflow", name: "旧工作流" }],
    });
    await fs.mkdir(path.join(legacyAgentHub, "skills", "legacy-skill"), { recursive: true });
    await fs.writeFile(path.join(legacyAgentHub, "skills", "legacy-skill", "SKILL.md"), "# 旧技能");

    await fs.writeFile(path.join(legacyKnowHub, "docspace", "store.json"), JSON.stringify({
      items: [{ id: "docspace-a", source: { type: "hosted", managedPath: path.join(legacyKnowHubPath, "docspace", "hosted", "docspace-a", "raw") } }],
    }));
    await fs.writeFile(path.join(legacyKnowHub, "knowledge", "store.json"), JSON.stringify({ items: [{ id: "knowledge-a" }] }));
    await fs.writeFile(path.join(legacyKnowHub, "docspace", "hosted", "docspace-a", "raw", "document.md"), "历史文档");
    await fs.writeFile(path.join(legacyKnowHub, "vector", "knowhub.sqlite"), "历史向量数据");

    const storageRoot = path.join(temporaryDirectory, "data", "storage");
    const currentAgentHub = path.join(storageRoot, "agenthub");
    const currentKnowHub = path.join(storageRoot, "knowhub");
    await fs.mkdir(currentAgentHub, { recursive: true });
    createAgentHubDatabase(path.join(currentAgentHub, "agenthub.db"), {
      applications: [{ id: "current-app", name: "新应用" }],
      capabilities: [],
      workflows: [],
    });
    await fs.mkdir(path.join(currentKnowHub, "docspace"), { recursive: true });
    await fs.mkdir(path.join(currentKnowHub, "knowledge"), { recursive: true });
    await fs.writeFile(path.join(currentKnowHub, "docspace", "store.json"), JSON.stringify({ items: [] }));
    await fs.writeFile(path.join(currentKnowHub, "knowledge", "store.json"), JSON.stringify({ items: [] }));

    process.chdir(temporaryDirectory);
    const { migrateRuntimeData } = await import("./migrate-runtime-data.mjs");
    assert.equal(migrateRuntimeData(), true);
    assert.equal(migrateRuntimeData(), false);

    const activeStorageRoot = await fs.realpath(storageRoot);
    const newAppFactory = path.join(activeStorageRoot, "appfactory");
    const migratedAppFactory = new Database(path.join(newAppFactory, "appfactory.db"), { readonly: true });
    assert.equal(migratedAppFactory.prepare("SELECT workspace_path AS value FROM projects").get().value, path.join(newAppFactory, "workspaces", "project-a"));
    assert.equal(migratedAppFactory.prepare("SELECT transcript_path AS value FROM sessions").get().value, path.join(newAppFactory, "transcripts", "session-a.jsonl"));
    assert.equal(migratedAppFactory.prepare("SELECT artifact_path AS value FROM publication_releases").get().value, path.join(newAppFactory, "releases", "project-a", "release-a"));
    assert.match(migratedAppFactory.prepare("SELECT result_json AS value FROM publication_jobs").get().value, /data\/storage\/appfactory/);
    migratedAppFactory.close();

    const mergedAgentHub = new Database(path.join(currentAgentHub, "agenthub.db"), { readonly: true });
    assert.equal(mergedAgentHub.prepare("SELECT COUNT(*) AS count FROM applications").get().count, 2);
    assert.equal(mergedAgentHub.prepare("SELECT COUNT(*) AS count FROM capabilities").get().count, 1);
    assert.equal(mergedAgentHub.prepare("SELECT COUNT(*) AS count FROM workflows").get().count, 1);
    mergedAgentHub.close();
    await fs.access(path.join(currentAgentHub, "skills", "legacy-skill", "SKILL.md"));
    await fs.access(path.join(storageRoot, "recovery"));

    const restoredDocspace = JSON.parse(await fs.readFile(path.join(currentKnowHub, "docspace", "store.json"), "utf8"));
    assert.equal(restoredDocspace.items.length, 1);
    assert.equal(restoredDocspace.items[0].source.managedPath, path.join(activeStorageRoot, "knowhub", "docspace", "hosted", "docspace-a", "raw"));
    assert.equal(await fs.readFile(path.join(currentKnowHub, "docspace", "hosted", "docspace-a", "raw", "document.md"), "utf8"), "历史文档");
    assert.equal(await fs.readFile(path.join(currentKnowHub, "vector", "knowhub.sqlite"), "utf8"), "历史向量数据");
  } finally {
    process.chdir(originalDirectory);
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
  }
});
