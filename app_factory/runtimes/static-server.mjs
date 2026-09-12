import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";

const [rootArgument, portArgument] = process.argv.slice(2);
const rootPath = path.resolve(rootArgument || "");
const port = Number(portArgument);

if (!rootArgument || !Number.isInteger(port) || port <= 0) {
  throw new Error("静态服务需要根目录与有效端口");
}

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
};

function resolveRequestPath(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl || "/", "http://localhost").pathname);
  const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const target = path.resolve(rootPath, relativePath);
  if (target !== rootPath && !target.startsWith(`${rootPath}${path.sep}`)) return null;
  return target;
}

const server = http.createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end();
    return;
  }
  try {
    const target = resolveRequestPath(request.url);
    if (!target) throw new Error("非法路径");
    const metadata = await stat(target);
    if (!metadata.isFile()) throw new Error("不是文件");
    response.writeHead(200, {
      "Content-Length": metadata.size,
      "Content-Type": mimeTypes[path.extname(target).toLowerCase()] || "application/octet-stream",
    });
    if (request.method === "HEAD") response.end();
    else createReadStream(target).pipe(response);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not Found");
  }
});

server.listen(port, "127.0.0.1");
