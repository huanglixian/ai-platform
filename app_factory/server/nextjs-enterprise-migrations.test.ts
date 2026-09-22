import assert from "node:assert/strict";
import test from "node:test";

// Node 的原生 TypeScript runner 需要显式扩展名，生产编译不参与该导入。
// @ts-expect-error TS 配置保持 Next.js 默认，不开启 TS 扩展名导入。
import { migrateNextjsEnterpriseWorkspace } from "./nextjs-enterprise-migrations.ts";

test("企业迁移在启动命令前要求数据库连接", async () => {
  const previous = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  try {
    await assert.rejects(
      migrateNextjsEnterpriseWorkspace("/workspace-not-used", "nextjs", {
        nodeEnv: "development",
      }),
      /DATABASE_URL/,
    );
  } finally {
    if (previous === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previous;
  }
});
