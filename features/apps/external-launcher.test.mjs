import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import { isProcessGroupRunning, isUrlReady, startExternalProcess, stopExternalProcess } from "./external-launcher.ts";

async function getAvailablePort() {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("无法分配测试端口");
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return address.port;
}

test("外部启动器能够等待服务就绪并停止其进程组", async () => {
  const port = await getAvailablePort();
  const url = `http://127.0.0.1:${port}`;
  const script = `require('node:http').createServer((_, response) => response.end('ok')).listen(${port}, '127.0.0.1')`;
  const result = await startExternalProcess({
    command: `${JSON.stringify(process.execPath)} -e ${JSON.stringify(script)}`,
    url,
    timeoutMs: 5_000,
  });

  assert.equal(result.alreadyRunning, false);
  assert.ok(result.pid);
  assert.equal(isProcessGroupRunning(result.pid), true);
  assert.equal(await isUrlReady(url), true);

  await stopExternalProcess(result.pid);
  assert.equal(isProcessGroupRunning(result.pid), false);
});

test("外部应用不会继承平台的 PORT", async () => {
  const originalPort = process.env.PORT;
  const port = await getAvailablePort();
  const url = `http://127.0.0.1:${port}`;
  const script = `const { createServer } = require('node:http'); const port = Number(process.env.PORT || ${port}); createServer((_, response) => response.end(String(port))).listen(port, '127.0.0.1')`;
  let result;

  process.env.PORT = "19844";
  try {
    result = await startExternalProcess({
      command: `${JSON.stringify(process.execPath)} -e ${JSON.stringify(script)}`,
      url,
      timeoutMs: 5_000,
    });

    const response = await fetch(url);
    assert.equal(await response.text(), String(port));
  } finally {
    if (result?.pid) await stopExternalProcess(result.pid);
    if (originalPort === undefined) delete process.env.PORT;
    else process.env.PORT = originalPort;
  }
});

test("外部应用不会继承平台的 Turbopack 开关", async () => {
  const originalTurbopack = process.env.TURBOPACK;
  const port = await getAvailablePort();
  const url = `http://127.0.0.1:${port}`;
  const script = `if (process.env.TURBOPACK) process.exit(1); require('node:http').createServer((_, response) => response.end('ok')).listen(${port}, '127.0.0.1')`;
  let result;

  process.env.TURBOPACK = "1";
  try {
    result = await startExternalProcess({
      command: `${JSON.stringify(process.execPath)} -e ${JSON.stringify(script)}`,
      url,
      timeoutMs: 5_000,
    });

    assert.equal(await isUrlReady(url), true);
  } finally {
    if (result?.pid) await stopExternalProcess(result.pid);
    if (originalTurbopack === undefined) delete process.env.TURBOPACK;
    else process.env.TURBOPACK = originalTurbopack;
  }
});

test("启动命令退出后不会等待完整健康检查超时", async () => {
  const port = await getAvailablePort();
  const startedAt = Date.now();

  await assert.rejects(
    startExternalProcess({
      command: `${JSON.stringify(process.execPath)} -e ${JSON.stringify("process.exit(1)")}`,
      url: `http://127.0.0.1:${port}`,
      timeoutMs: 5_000,
    }),
    /启动命令已退出，服务没有成功启动/,
  );

  assert.ok(Date.now() - startedAt < 2_000);
});
