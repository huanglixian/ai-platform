import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

// Node 的原生 TypeScript runner 需要显式扩展名，生产编译不参与该导入。
// @ts-expect-error TS 配置保持 Next.js 默认，不开启 TS 扩展名导入。
import { materializeRuntimeWorkspace } from "./runtime-workspace.ts";

test("运行副本只复制应用源码，不带入依赖和构建产物", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "appfactory-runtime-workspace-"));
  const source = path.join(root, "source");
  const destination = path.join(root, "runtime");
  await fs.mkdir(path.join(source, "app"), { recursive: true });
  await fs.mkdir(path.join(source, "public"), { recursive: true });
  await fs.mkdir(path.join(source, ".next", "dev"), { recursive: true });
  await fs.mkdir(path.join(source, "node_modules", "next"), { recursive: true });
  await fs.writeFile(path.join(source, "app", "page.tsx"), "export default function Page() { return null; }");
  await fs.writeFile(path.join(source, "public", "logo.svg"), "<svg />");
  await fs.writeFile(path.join(source, ".next", "dev", "lock"), "preview");
  await fs.writeFile(path.join(source, "node_modules", "next", "package.json"), "{}");
  await fs.writeFile(path.join(source, "tsconfig.tsbuildinfo"), "cache");

  try {
    await materializeRuntimeWorkspace(source, destination);
    assert.equal(await fs.readFile(path.join(destination, "app", "page.tsx"), "utf8"), "export default function Page() { return null; }");
    assert.equal(await fs.readFile(path.join(destination, "public", "logo.svg"), "utf8"), "<svg />");
    await assert.rejects(fs.access(path.join(destination, ".next")));
    await assert.rejects(fs.access(path.join(destination, "node_modules")));
    await assert.rejects(fs.access(path.join(destination, "tsconfig.tsbuildinfo")));
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
