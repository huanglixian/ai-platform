import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

// Node 的原生 TypeScript runner 需要显式扩展名，生产编译不参与该导入。
// @ts-expect-error TS 配置保持 Next.js 默认，不开启 TS 扩展名导入。
import { readApplicationManifest, validateProject } from "./validator.ts";

async function createWorkspace(healthPath: string) {
  const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "appfactory-manifest-"));
  await fs.writeFile(
    path.join(workspace, "app.yaml"),
    `name: test\nversion: 1.0.0\nruntime: nextjs\nentry: app/page.tsx\nhealthPath: ${healthPath}\ncapabilities: []\n`,
  );
  return workspace;
}

test("读取并校验发布健康路径", async () => {
  const workspace = await createWorkspace("/ready");
  try {
    assert.equal((await readApplicationManifest(workspace)).healthPath, "/ready");
    assert.equal((await validateProject(workspace)).some((check) => check.level === "error"), false);
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
});

test("拒绝非站内健康路径", async () => {
  const workspace = await createWorkspace("//outside.example");
  try {
    assert.deepEqual(
      (await validateProject(workspace)).filter((check) => check.level === "error"),
      [{ level: "error", message: "healthPath 必须是以 / 开头的站内路径" }],
    );
  } finally {
    await fs.rm(workspace, { recursive: true, force: true });
  }
});
