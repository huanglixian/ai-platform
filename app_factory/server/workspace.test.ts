import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

// Node 的原生 TypeScript runner 需要显式扩展名，生产编译不参与该导入。
// @ts-expect-error TS 配置保持 Next.js 默认，不开启 TS 扩展名导入。
import { isWorkspaceEntryVisible, runWorkspaceCommand, runWorkspaceExecutable } from "./workspace.ts";

test("文件列表忽略依赖和构建产物目录", () => {
  assert.equal(isWorkspaceEntryVisible("node_modules"), false);
  assert.equal(isWorkspaceEntryVisible(".next"), false);
  assert.equal(isWorkspaceEntryVisible("out"), false);
  assert.equal(isWorkspaceEntryVisible("app"), true);
  assert.equal(isWorkspaceEntryVisible("app/page.tsx"), true);
});

test("构建命令可以显式使用生产环境", async () => {
  const result = await runWorkspaceCommand(
    process.cwd(),
    "printf '%s' \"$NODE_ENV\"",
    30_000,
    { nodeEnv: "production" },
  );
  assert.equal(result.stdout, "production");
});

test("受控可执行程序只接收明确注入的环境变量", async () => {
  const result = await runWorkspaceExecutable(
    process.cwd(),
    process.execPath,
    ["-e", "process.stdout.write([process.env.NODE_ENV, process.env.DATABASE_URL, Boolean(process.env.APPFACTORY_COCKPIT_API_KEY)].join('|'))"],
    30_000,
    {
      nodeEnv: "production",
      environment: { DATABASE_URL: "postgresql://isolated.example/app" },
    },
  );
  assert.equal(result.stdout, "production|postgresql://isolated.example/app|false");
});

test("构建命令可以被发布任务取消", async () => {
  const controller = new AbortController();
  const command = runWorkspaceCommand(
    process.cwd(),
    "sleep 5",
    30_000,
    { signal: controller.signal },
  );
  controller.abort(new Error("发布已取消"));
  await assert.rejects(command, /发布已取消/);
});

test("取消构建会终止其后台子进程", async () => {
  const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "appfactory-command-"));
  const pidFile = path.join(temporaryDirectory, "child.pid");
  const controller = new AbortController();
  const script = [
    "const fs=require('fs')",
    "const {spawn}=require('child_process')",
    "const child=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore'})",
    `fs.writeFileSync(${JSON.stringify(pidFile)},String(child.pid))`,
    "setInterval(()=>{},1000)",
  ].join(";");
  const command = runWorkspaceCommand(process.cwd(), `node -e ${JSON.stringify(script)}`, 30_000, {
    signal: controller.signal,
  });
  let childPid = 0;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      childPid = Number(await fs.readFile(pidFile, "utf8"));
      break;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
  }
  assert.ok(childPid > 0, "后台子进程未启动");
  controller.abort(new Error("发布已取消"));
  await assert.rejects(command, /发布已取消/);
  await new Promise((resolve) => setTimeout(resolve, 100));
  assert.throws(() => process.kill(childPid, 0), { code: "ESRCH" });
  await fs.rm(temporaryDirectory, { recursive: true, force: true });
});
