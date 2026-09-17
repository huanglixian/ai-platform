import { getDatabasePool } from "../db/database.ts";
import { migrationsReady } from "../db/migrations.ts";

export async function checkHealth() {
  if (!await migrationsReady()) {
    return { ok: false, reason: "数据库迁移未完成" } as const;
  }
  await getDatabasePool().query("SELECT 1");
  return { ok: true } as const;
}
