import net from "node:net";

type ReadinessOptions = {
  timeoutMs?: number;
  intervalMs?: number;
  signal?: AbortSignal;
};

function delay(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const finish = () => {
      signal?.removeEventListener("abort", abort);
      resolve();
    };
    const abort = () => {
      clearTimeout(timer);
      reject(signal?.reason);
    };
    const timer = setTimeout(finish, ms);
    signal?.addEventListener("abort", abort, { once: true });
  });
}

export async function waitForHttpReady(
  url: string,
  {
    timeoutMs = 20_000,
    intervalMs = 100,
    signal,
  }: ReadinessOptions = {},
) {
  const deadline = Date.now() + timeoutMs;
  let lastStatus = "尚未建立连接";

  while (Date.now() < deadline) {
    if (signal?.aborted) throw signal.reason;
    const requestTimeout = Math.max(1, Math.min(1_000, deadline - Date.now()));
    const requestSignal = signal
      ? AbortSignal.any([signal, AbortSignal.timeout(requestTimeout)])
      : AbortSignal.timeout(requestTimeout);

    try {
      const response = await fetch(url, {
        cache: "no-store",
        method: "HEAD",
        signal: requestSignal,
      });
      if (response.ok) return;
      lastStatus = `HTTP ${response.status}`;
    } catch (error) {
      if (signal?.aborted) throw signal.reason;
      lastStatus = error instanceof Error ? error.message : "连接失败";
    }

    await delay(Math.min(intervalMs, Math.max(0, deadline - Date.now())), signal);
  }

  throw new Error(`Preview 启动超时：${lastStatus}`);
}

function portIsAvailable(port: number) {
  return new Promise<boolean>((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.once("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE") resolve(false);
      else reject(error);
    });
    server.listen(
      { port, host: "::", ipv6Only: false, exclusive: true },
      () => {
        server.close((error) => (error ? reject(error) : resolve(true)));
      },
    );
  });
}

export async function findAvailablePort(startPort: number) {
  for (let port = startPort; port <= 65_535; port += 1) {
    if (await portIsAvailable(port)) return port;
  }
  throw new Error("没有可用的 Preview 端口");
}
