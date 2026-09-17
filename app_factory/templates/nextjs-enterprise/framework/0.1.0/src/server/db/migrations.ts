import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { getDatabaseConfig } from "../env/runtime-config.ts";
import { getDatabasePool, quoteIdentifier, transaction } from "./database.ts";

type Migration = {
  id: string;
  number: number;
  file: string;
};

const frameworkMigrationNames = new Set(["0001_framework_identity.sql"]);

function migrationRoot() {
  return path.join(process.cwd(), "db", "migrations");
}

async function listMigrations(): Promise<Migration[]> {
  const entries = await fs.readdir(migrationRoot(), { withFileTypes: true }).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return [];
    throw error;
  });
  const migrations: Migration[] = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".sql")) continue;
    const match = entry.name.match(/^(\d{4})_([a-z0-9][a-z0-9_-]*)\.sql$/i);
    if (!match) throw new Error(`迁移文件命名无效：${entry.name}`);
    const number = Number(match[1]);
    if (number <= 999 && !frameworkMigrationNames.has(entry.name)) {
      throw new Error(`0001–0999 保留给 Framework 迁移：${entry.name}`);
    }
    if (number >= 9_000) throw new Error(`9000–9999 是预留迁移编号：${entry.name}`);
    migrations.push({ id: entry.name, number, file: path.join(migrationRoot(), entry.name) });
  }
  for (const name of frameworkMigrationNames) {
    if (!migrations.some((migration) => migration.id === name)) {
      throw new Error(`缺少 Framework 迁移：${name}`);
    }
  }
  return migrations.sort((left, right) => left.number - right.number || left.id.localeCompare(right.id));
}

async function ensureMigrationTable() {
  const schema = quoteIdentifier(getDatabaseConfig().databaseSchema);
  const pool = getDatabasePool();
  await pool.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
  await pool.query(
    `CREATE TABLE IF NOT EXISTS ${schema}.schema_migrations (
      id TEXT PRIMARY KEY,
      checksum TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
  );
}

function checksum(content: string) {
  return createHash("sha256").update(content).digest("hex");
}

export async function migrateDatabase() {
  const migrations = await listMigrations();
  await ensureMigrationTable();
  const schemaName = getDatabaseConfig().databaseSchema;
  const schema = quoteIdentifier(schemaName);
  await transaction(async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
      `app-migrations:${schemaName}`,
    ]);
    for (const migration of migrations) {
      const sql = (await fs.readFile(migration.file, "utf8")).replaceAll("{{ENTERPRISE_SCHEMA}}", schema);
      const digest = checksum(sql);
      const applied = await client.query<{ checksum: string }>(
        `SELECT checksum FROM ${schema}.schema_migrations WHERE id=$1`,
        [migration.id],
      );
      if (applied.rowCount) {
        if (applied.rows[0]?.checksum !== digest) {
          throw new Error(`已执行迁移不能被修改：${migration.id}`);
        }
        continue;
      }
      await client.query(sql);
      await client.query(
        `INSERT INTO ${schema}.schema_migrations(id, checksum) VALUES ($1, $2)`,
        [migration.id, digest],
      );
    }
  });
  return migrations.map((migration) => migration.id);
}

export async function migrationsReady() {
  const migrations = await listMigrations();
  await ensureMigrationTable();
  const schema = quoteIdentifier(getDatabaseConfig().databaseSchema);
  const result = await getDatabasePool().query<{ id: string }>(
    `SELECT id FROM ${schema}.schema_migrations WHERE id = ANY($1::text[])`,
    [migrations.map((migration) => migration.id)],
  );
  return result.rowCount === migrations.length;
}
