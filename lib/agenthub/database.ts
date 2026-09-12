import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const storageDir = path.join(process.cwd(), "storage", "agenthub");
const databasePath = path.join(storageDir, "agenthub.db");

let connection: Database.Database | undefined;

const migrations = [
  {
    id: "001_base",
    sql: `CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      producer TEXT NOT NULL,
      kind TEXT NOT NULL,
      runtime TEXT NOT NULL,
      status TEXT NOT NULL,
      entry_url TEXT,
      version TEXT,
      external_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS workflows (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL,
      definition_json TEXT NOT NULL DEFAULT '{}',
      version INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS capabilities (
      id TEXT PRIMARY KEY,
      version TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      kind TEXT NOT NULL,
      protocol TEXT NOT NULL,
      schema_json TEXT NOT NULL DEFAULT '{}',
      handler_key TEXT,
      endpoint TEXT,
      credential_ref TEXT,
      status TEXT NOT NULL,
      availability TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );`,
  },
  { id: "002_workflow_category", sql: "ALTER TABLE workflows ADD COLUMN category TEXT NOT NULL DEFAULT '业务审批';" },
  {
    id: "003_audit_actor",
    sql: `ALTER TABLE applications ADD COLUMN created_by TEXT NOT NULL DEFAULT 'local-user';
ALTER TABLE applications ADD COLUMN updated_by TEXT NOT NULL DEFAULT 'local-user';
ALTER TABLE workflows ADD COLUMN created_by TEXT NOT NULL DEFAULT 'local-user';
ALTER TABLE workflows ADD COLUMN updated_by TEXT NOT NULL DEFAULT 'local-user';
ALTER TABLE capabilities ADD COLUMN created_by TEXT NOT NULL DEFAULT 'system';
ALTER TABLE capabilities ADD COLUMN updated_by TEXT NOT NULL DEFAULT 'system';`,
  },
  {
    id: "004_external_app_runtime",
    sql: `ALTER TABLE applications ADD COLUMN launch_command TEXT;
ALTER TABLE applications ADD COLUMN launch_pid INTEGER;
ALTER TABLE applications ADD COLUMN launch_started_at TEXT;
DELETE FROM applications WHERE producer = 'native' OR id LIKE 'app-native-%';`,
  },
  {
    id: "005_external_launch_status",
    sql: `ALTER TABLE applications ADD COLUMN launch_status TEXT;
UPDATE applications SET launch_status='running' WHERE producer='external' AND launch_pid IS NOT NULL;`,
  },
];

export function getAgentHubDatabase(): Database.Database {
  if (connection) return connection;
  fs.mkdirSync(storageDir, { recursive: true });
  connection = new Database(databasePath);
  connection.pragma("journal_mode = WAL");
  connection.pragma("foreign_keys = ON");
  connection.pragma("busy_timeout = 5000");
  connection.exec("CREATE TABLE IF NOT EXISTS schema_migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL)");
  const applied = new Set((connection.prepare("SELECT id FROM schema_migrations").all() as { id: string }[]).map((row) => row.id));
  const apply = connection.transaction(() => {
    for (const migration of migrations) {
      if (applied.has(migration.id)) continue;
      connection!.exec(migration.sql);
      connection!.prepare("INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)").run(migration.id, new Date().toISOString());
    }
  });
  apply();
  return connection;
}

export function closeAgentHubDatabase() {
  connection?.close();
  connection = undefined;
}

export const agentHubDatabasePath = databasePath;
