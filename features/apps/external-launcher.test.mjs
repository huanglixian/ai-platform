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
