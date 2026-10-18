import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

import { dataPaths } from "@/lib/data-paths";
import { identitySchema } from "@/features/auth/schema";
import { builtInRoles } from "@/features/auth/types";

const storageDir = dataPaths.agentHub;
const databasePath = path.join(storageDir, "agenthub.db");

let connection: Database.Database | undefined;

const applicationSchema = `
CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
  producer TEXT NOT NULL, kind TEXT NOT NULL, runtime TEXT NOT NULL, status TEXT NOT NULL,
  entry_url TEXT, version TEXT, external_id TEXT, launch_command TEXT, launch_pid INTEGER,
  launch_started_at TEXT, launch_status TEXT,
  created_by TEXT NOT NULL DEFAULT 'system', updated_by TEXT NOT NULL DEFAULT 'system',
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS applications_source_external_id ON applications(producer,external_id) WHERE external_id IS NOT NULL;
CREATE TABLE IF NOT EXISTS workflows (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL, definition_json TEXT NOT NULL DEFAULT '{}', version INTEGER NOT NULL DEFAULT 1,
  category TEXT NOT NULL DEFAULT '业务审批',
  created_by TEXT NOT NULL DEFAULT 'system', updated_by TEXT NOT NULL DEFAULT 'system',
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS capabilities (
  id TEXT PRIMARY KEY, version TEXT NOT NULL, name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
  kind TEXT NOT NULL, protocol TEXT NOT NULL, schema_json TEXT NOT NULL DEFAULT '{}',
  handler_key TEXT, endpoint TEXT, credential_ref TEXT, status TEXT NOT NULL, availability TEXT NOT NULL,
  created_by TEXT NOT NULL DEFAULT 'system', updated_by TEXT NOT NULL DEFAULT 'system',
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS application_seed_state (id INTEGER PRIMARY KEY CHECK(id=1), seeded_at TEXT NOT NULL);
`;

export function getAgentHubDatabase(): Database.Database {
  if (connection) return connection;
  fs.mkdirSync(storageDir, { recursive: true });
  connection = new Database(databasePath);
  connection.pragma("journal_mode = WAL");
  connection.pragma("foreign_keys = ON");
  connection.pragma("busy_timeout = 5000");
  connection.exec(applicationSchema);
  connection.exec(identitySchema);
  connection.transaction(() => {
    for (const role of builtInRoles) {
      connection!.prepare("INSERT OR IGNORE INTO platform_roles(code,name,description) VALUES (?,?,?)").run(role.code, role.name, role.description);
      for (const permission of role.permissions) {
        connection!.prepare("INSERT OR IGNORE INTO platform_role_permissions(role_code,permission) VALUES (?,?)").run(role.code, permission);
      }
    }
  })();
  return connection;
}

export function closeAgentHubDatabase() {
  connection?.close();
  connection = undefined;
}

export const agentHubDatabasePath = databasePath;
