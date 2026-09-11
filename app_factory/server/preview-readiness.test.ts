import assert from "node:assert/strict";
import http from "node:http";
import test from "node:test";

// Node 的原生 TypeScript runner 需要显式扩展名，生产编译不参与该导入。
// @ts-expect-error TS 配置保持 Next.js 默认，不开启 TS 扩展名导入。
import { findAvailablePort, waitForHttpReady } from "./preview-readiness.ts";

function listen(server: http.Server, host = "127.0.0.1") {
  return new Promise<number>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, host, () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("测试服务未获得端口"));
        return;
      }
      resolve(address.port);
    });
  });
}

function close(server: http.Server) {
  return new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("Preview 只有在 HTTP 服务真正就绪后才返回", async () => {
  let requests = 0;
  const server = http.createServer((_, response) => {
    requests += 1;
    response.statusCode = requests < 3 ? 503 : 200;
    response.end();
  });
  const port = await listen(server);

  try {
    await waitForHttpReady(`http://127.0.0.1:${port}`, {
      timeoutMs: 1_000,
      intervalMs: 10,
    });
    assert.equal(requests, 3);
  } finally {
    await close(server);
  }
});

test("Preview 首屏探测会等待 GET 正文完整返回", async () => {
  let method = "";
  let bodyFinished = false;
  const server = http.createServer((request, response) => {
    method = request.method ?? "";
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.write("<main>");
    setTimeout(() => {
      bodyFinished = true;
      response.end("已就绪</main>");
    }, 30);
  });
  const port = await listen(server);

  try {
    await waitForHttpReady(`http://127.0.0.1:${port}`, {
      timeoutMs: 1_000,
      intervalMs: 10,
      requestMethod: "GET",
    });
    assert.equal(method, "GET");
    assert.equal(bodyFinished, true);
  } finally {
    await close(server);
  }
});

test("Preview 端口被占用时选择下一个可用端口", async () => {
  const server = http.createServer((_, response) => response.end());
  const occupiedPort = await listen(server, "::");

  try {
    assert.equal(await findAvailablePort(occupiedPort), occupiedPort + 1);
  } finally {
    await close(server);
  }
});
