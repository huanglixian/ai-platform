import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import test from "node:test";

// Node 的原生 TypeScript runner 需要显式扩展名，生产编译不参与该导入。
// @ts-expect-error TS 配置保持 Next.js 默认，不开启 TS 扩展名导入。
import { staticWebRuntime } from "./static-web.ts";

async function findPort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  await new Promise((resolve) => server.close(resolve));
  if (!address || typeof address === "string") throw new Error("未能分配测试端口");
  return address.port;
}

async function waitForPage(url) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
    } catch {
      // 进程正在启动。
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("静态服务未在预期时间内就绪");
}

test("纯 HTML 运行时打包并提供静态 Release", async () => {
  const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "appfactory-static-workspace-"));
  const release = path.join(workspace, "release");
  const port = await findPort();
  let child;
  try {
    await fs.mkdir(path.join(workspace, "public"));
    await fs.writeFile(path.join(workspace, "public", "index.html"), "<h1>Static release</h1>");
    await fs.writeFile(path.join(workspace, "dev_todo.md"), "不应发布");

    const logs = [];
    await staticWebRuntime.buildRelease(workspace, release, {
      onLog: (log) => logs.push(log),
    });
    assert.equal(await fs.readFile(path.join(release, "index.html"), "utf8"), "<h1>Static release</h1>");
    await assert.rejects(fs.access(path.join(release, "dev_todo.md")));
    assert.equal(logs[0]?.stage, "package");

    const command = staticWebRuntime.createReleaseCommand(release, port);
    child = spawn(command.executable, command.args, { cwd: command.cwd });
    const response = await waitForPage(`http://127.0.0.1:${port}`);
    assert.equal(await response.text(), "<h1>Static release</h1>");
  } finally {
    child?.kill("SIGTERM");
    await fs.rm(workspace, { recursive: true, force: true });
  }
});
