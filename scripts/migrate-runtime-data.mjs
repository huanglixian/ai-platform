import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

import { dataPaths } from "../lib/data-paths.ts";

function tableExists(database, tableName) {
  return Boolean(
    database.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(tableName),
  );
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

    const update = database.transaction(() => {
      for (const legacyDirectory of legacyDirectories) {
        updatePath(legacyDirectory, "projects", "workspace_path");
        updatePath(legacyDirectory, "sessions", "transcript_path");
        updatePath(legacyDirectory, "publication_releases", "artifact_path");
        updatePath(legacyDirectory, "publication_jobs", "result_json");
      }
    });
    update();
  } finally {
    database.close();
  }
}

export function migrateRuntimeData() {
  const legacyRoot = path.join(process.cwd(), "storage");
  if (!fs.existsSync(legacyRoot)) return false;

  let migrated = false;
  for (const name of ["agenthub", "appfactory"]) {
    const source = path.join(legacyRoot, name);
    const destination = path.join(dataPaths.storage, name);
    if (!fs.existsSync(source) || fs.existsSync(destination)) continue;
    const legacyDirectories = name === "appfactory"
      ? [...new Set([source, fs.realpathSync(source)])]
      : [];
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.renameSync(source, destination);
    if (name === "appfactory") replaceStoredAppFactoryPaths(destination, legacyDirectories);
    migrated = true;
  }

  return migrated;
}
