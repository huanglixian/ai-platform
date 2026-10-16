import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

import { dataPaths } from "@/lib/data-paths";

const storageDir = dataPaths.agentHub;
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
  {
    id: "006_application_seed_once",
    sql: `CREATE TABLE IF NOT EXISTS application_seed_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  seeded_at TEXT NOT NULL
);`,
  },
  { id: "008_remove_assistant_settings", sql: "DROP TABLE IF EXISTS assistant_settings;" },
  {
    id: "009_ai_crm_demo",
    sql: `UPDATE applications
      SET name='AI-CRM',
          entry_url='http://localhost:19854',
          launch_command='cd "/Users/huanglixian-m2/Documents/LienCode/AI-CRM-demo" && npm run start',
          updated_at=strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      WHERE id='app-external-customer-management' AND producer='external';`,
  },
  {
    id: "010_ai_crm_name",
    sql: `UPDATE applications
      SET name='AI-CRM',
          updated_at=strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      WHERE id='app-external-customer-management' AND producer='external';`,
  },
  {
    id: "011_ai_crm_production_start",
    sql: `UPDATE applications
      SET launch_command='cd "/Users/huanglixian-m2/Documents/LienCode/AI-CRM-demo" && npm run start',
          updated_at=strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      WHERE id='app-external-customer-management' AND producer='external';`,
  },
  {
    id: "012_dagefan_ltc",
    sql: `INSERT OR IGNORE INTO applications
      (id,name,description,producer,kind,runtime,status,entry_url,version,external_id,launch_command,created_at,updated_at)
      VALUES (
        'app-external-dagefan-ltc',
        '大鸽饭 AI 销售与客户订货',
        '贯通客户开发、销售跟进、客户自主订货、订单履约和应收开票，提供个人与管理工作台及 AI 辅助。',
        'external','business','web','active','http://localhost:19848','1.0.0','desktop-dagefan-ltc',
        'cd "/Users/huanglixian-m2/Documents/LienCode/dagefan-LTC" && npm run start',
        strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      );`,
  },
  {
    id: "013_gy_ai_crm_name",
    sql: `UPDATE applications
      SET name='GY-Ai-CRM',
          updated_at=strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      WHERE id='app-external-customer-management' AND producer='external';`,
  },
  {
    id: "014_qiaoyin_crm",
    sql: `UPDATE applications
      SET name='AI-CRM-demo',
          updated_at=strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      WHERE id='app-external-customer-management' AND producer='external';
      INSERT OR IGNORE INTO applications
      (id,name,description,producer,kind,runtime,status,entry_url,version,external_id,launch_command,created_at,updated_at)
      VALUES (
        'app-external-qiaoyin-crm',
        '侨银AI-CRM',
        '统一管理客户、人脉、线索和销售项目，提供个人与团队工作台、管理驾驶舱及 AI 问数和跟进辅助。',
        'external','business','web','active','http://localhost:19855','1.0.0','desktop-qiaoyin-crm',
        'cd "/Users/huanglixian-m2/Documents/LienCode/AI-CRM" && docker compose up -d --wait --wait-timeout 20 postgres && npm run start',
        strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      );`,
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
