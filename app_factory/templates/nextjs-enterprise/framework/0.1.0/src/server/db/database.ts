import { Pool, type PoolClient, type QueryResultRow } from "pg";

import { getDatabaseConfig, validateDatabaseSchema } from "../env/runtime-config.ts";

export type SqlClient = Pick<Pool | PoolClient, "query">;

let pool: Pool | undefined;

export function quoteIdentifier(identifier: string) {
  return `"${identifier.replaceAll('"', '""')}"`;
}

export function appTable(tableName: string) {
  if (!/^[a-z][a-z0-9_]{0,62}$/.test(tableName)) {
    throw new Error("应用表名不合法");
  }
  return `${quoteIdentifier(validateDatabaseSchema(getDatabaseConfig().databaseSchema))}.${quoteIdentifier(tableName)}`;
}

export function getDatabasePool() {
  if (!pool) {
    pool = new Pool({
      connectionString: getDatabaseConfig().databaseUrl,
      max: 10,
    });
  }
  return pool;
}

export async function closeDatabasePool() {
  const activePool = pool;
  pool = undefined;
  await activePool?.end();
}

export async function transaction<T>(work: (client: PoolClient) => Promise<T>) {
  const client = await getDatabasePool().connect();
  try {
    await client.query("BEGIN");
    const value = await work(client);
    await client.query("COMMIT");
    return value;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export async function query<T extends QueryResultRow>(text: string, values: unknown[] = []) {
  return getDatabasePool().query<T>(text, values);
}
