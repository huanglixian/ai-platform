import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

import { dataPaths } from "../lib/data-paths.ts";

const agentHubTables = ["applications", "capabilities", "workflows"];

function tableExists(database, tableName, schema = "main") {
  return Boolean(
    database.prepare(`SELECT 1 FROM ${schema}.sqlite_master WHERE type='table' AND name=?`).get(tableName),
  );
}

function tableColumns(database, tableName) {
  return database.prepare(`PRAGMA table_info(${tableName})`).all().map((column) => column.name);
}

function replaceStoredAppFactoryPaths(directory, legacyDirectories) {
  const databasePath = path.join(directory, "appfactory.db");
  if (!fs.existsSync(databasePath)) return;

  const database = new Database(databasePath);
  try {
    const updatePath = (legacyDirectory, tableName, columnName) => {
      if (!tableExists(database, tableName)) return;
      database.prepare(
        `UPDATE ${tableName} SET ${columnName}=replace(${columnName}, ?, ?) WHERE instr(${columnName}, ?) > 0`,
      ).run(legacyDirectory, directory, legacyDirectory);
    };

    database.transaction(() => {
      for (const legacyDirectory of legacyDirectories) {
        updatePath(legacyDirectory, "projects", "workspace_path");
        updatePath(legacyDirectory, "sessions", "transcript_path");
        updatePath(legacyDirectory, "publication_releases", "artifact_path");
        updatePath(legacyDirectory, "publication_jobs", "result_json");
      }
    })();
  } finally {
    database.close();
  }
}

function replaceStoredKnowHubPaths(directory, legacyDirectories) {
  const visit = (currentDirectory) => {
    for (const entry of fs.readdirSync(currentDirectory, { withFileTypes: true })) {
      const entryPath = path.join(currentDirectory, entry.name);
      if (entry.isDirectory()) {
        visit(entryPath);
        continue;
      }
      if (!entry.isFile() || path.extname(entry.name) !== ".json") continue;

      let content = fs.readFileSync(entryPath, "utf8");
      for (const legacyDirectory of legacyDirectories) {
        content = content.replaceAll(legacyDirectory, directory);
      }
      fs.writeFileSync(entryPath, content);
    }
  };

  visit(directory);
}

function archiveLegacyDirectory(directory, name) {
  const recoveryDirectory = path.join(dataPaths.storage, "recovery");
  fs.mkdirSync(recoveryDirectory, { recursive: true });
  fs.renameSync(directory, path.join(recoveryDirectory, `${name}-${Date.now()}`));
}

function copyMissingSkills(source, destination) {
  const sourceSkills = path.join(source, "skills");
  if (!fs.existsSync(sourceSkills)) return;
  fs.cpSync(sourceSkills, path.join(destination, "skills"), {
    recursive: true,
    force: false,
    errorOnExist: false,
  });
}

function mergeLegacyAgentHub(source, destination) {
  const sourceDatabasePath = path.join(source, "agenthub.db");
  const destinationDatabasePath = path.join(destination, "agenthub.db");
  if (!fs.existsSync(sourceDatabasePath) || !fs.existsSync(destinationDatabasePath)) return;

  const database = new Database(destinationDatabasePath);
  let attached = false;
  try {
    database.prepare("ATTACH DATABASE ? AS legacy").run(sourceDatabasePath);
    attached = true;
    database.transaction(() => {
      for (const tableName of agentHubTables) {
        if (!tableExists(database, tableName) || !tableExists(database, tableName, "legacy")) continue;
        const columns = tableColumns(database, tableName);
        database.exec(`INSERT OR REPLACE INTO ${tableName} (${columns.join(",")})
          SELECT ${columns.join(",")} FROM legacy.${tableName}`);
      }
    })();
  } finally {
    if (attached) database.exec("DETACH DATABASE legacy");
    database.close();
  }
}

function readItemCount(filePath) {
  if (!fs.existsSync(filePath)) return 0;
  const content = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return Array.isArray(content.items) ? content.items.length : 0;
}

function directoryHasFiles(directory) {
  if (!fs.existsSync(directory)) return false;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isFile() || (entry.isDirectory() && directoryHasFiles(entryPath))) return true;
  }
  return false;
}

function isKnowHubEmpty(directory) {
  return readItemCount(path.join(directory, "docspace", "store.json")) === 0
    && readItemCount(path.join(directory, "knowledge", "store.json")) === 0
    && !directoryHasFiles(path.join(directory, "docspace", "hosted"))
    && !directoryHasFiles(path.join(directory, "vector"));
}

function moveRuntimeDirectory(source, destination, afterMove) {
  if (!fs.existsSync(source) || fs.existsSync(destination)) return false;
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.renameSync(source, destination);
  afterMove?.();
  return true;
}

export function migrateRuntimeData() {
  const legacyRoot = path.join(process.cwd(), "storage");
  if (!fs.existsSync(legacyRoot)) return false;

  let migrated = false;
  const legacyAgentHub = path.join(legacyRoot, "agenthub");
  const agentHub = dataPaths.agentHub;
  if (fs.existsSync(legacyAgentHub)) {
    if (fs.existsSync(agentHub)) {
      mergeLegacyAgentHub(legacyAgentHub, agentHub);
      copyMissingSkills(legacyAgentHub, agentHub);
      archiveLegacyDirectory(legacyAgentHub, "agenthub-legacy");
      migrated = true;
    } else {
      migrated = moveRuntimeDirectory(legacyAgentHub, agentHub) || migrated;
    }
  }

  const legacyAppFactory = path.join(legacyRoot, "appfactory");
  if (fs.existsSync(legacyAppFactory)) {
    const legacyDirectories = [...new Set([legacyAppFactory, fs.realpathSync(legacyAppFactory)])];
    migrated = moveRuntimeDirectory(
      legacyAppFactory,
      dataPaths.appFactory,
      () => replaceStoredAppFactoryPaths(dataPaths.appFactory, legacyDirectories),
    ) || migrated;
  }

  const legacyKnowHub = path.join(legacyRoot, "knowhub");
  const knowHub = dataPaths.knowHub;
  if (fs.existsSync(legacyKnowHub)) {
    const legacyDirectories = [...new Set([legacyKnowHub, fs.realpathSync(legacyKnowHub)])];
    if (fs.existsSync(knowHub) && isKnowHubEmpty(knowHub)) {
      archiveLegacyDirectory(knowHub, "knowhub-empty");
      fs.renameSync(legacyKnowHub, knowHub);
      replaceStoredKnowHubPaths(knowHub, legacyDirectories);
      migrated = true;
    } else {
      migrated = moveRuntimeDirectory(
        legacyKnowHub,
        knowHub,
        () => replaceStoredKnowHubPaths(knowHub, legacyDirectories),
      ) || migrated;
    }
  }

  return migrated;
}
