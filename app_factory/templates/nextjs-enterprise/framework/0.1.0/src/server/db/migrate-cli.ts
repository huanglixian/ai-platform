import { closeDatabasePool } from "./database.ts";
import { migrateDatabase } from "./migrations.ts";

migrateDatabase()
  .then((migrations) => {
    process.stdout.write(`数据库迁移完成：${migrations.join(", ")}\n`);
  })
  .catch((error) => {
    console.error("数据库迁移失败", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabasePool();
  });
