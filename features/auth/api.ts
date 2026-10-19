import { getAgentHubDatabase } from "@/lib/agenthub/database";
import { getAppFactoryDatabase } from "@/app_factory/server/database";
import {
  canManageApplication,
  canUseResource,
  getResourcePolicy,
} from "@/features/access/server";
import { apiError } from "@/lib/server/api-response";
import { runAsUser } from "./context";
import { AuthError } from "./errors";
import { readSession, sessionToken } from "./session";
import { hasPermission, type Permission, type Principal } from "./types";
import { isPlatformHost } from "./origin";

export function checkRequestOrigin(request: Request) {
  if (!isPlatformHost(new URL(request.url).hostname))
    throw new AuthError("请使用平台配置的访问地址");
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return;
  const origin = request.headers.get("origin");
  if (
    !origin ||
    origin !== new URL(request.url).origin ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    throw new AuthError("请求来源无效");
}

function requirePermission(user: Principal, permission: Permission) {
  if (!hasPermission(user, permission))
    throw new AuthError("没有执行此操作的权限");
}

export function authorizeApiRequest(request: Request, user: Principal) {
  const path = new URL(request.url).pathname;
  if (path.startsWith("/api/platform/auth/")) return;
  if (path.startsWith("/api/platform/users"))
    return requirePermission(user, "users.manage");
  if (path.startsWith("/api/platform/roles"))
    return requirePermission(user, "roles.manage");
  if (path === "/api/platform/assistant/chat") return;
  if (path.startsWith("/api/agenthub/v1/applications")) {
    const tail = path
      .slice("/api/agenthub/v1/applications".length)
      .split("/")
      .filter(Boolean);
    if (!tail.length) {
      if (request.method !== "GET")
        requirePermission(user, "applications.manage");
      return;
    }
    if (tail[0] === "stop" || tail[0] === "import")
      return requirePermission(user, "applications.manage");
    if (tail[1] === "deployment") requirePermission(user, "applications.manage");
    const policy = getResourcePolicy(
      "application",
      decodeURIComponent(tail[0]),
    );
    if (
      request.method === "GET" && tail.length === 1
        ? !canUseResource(user, policy) && !hasPermission(user, "applications.govern")
        : !canManageApplication(user, policy)
    )
      throw new AuthError("应用不存在或无权访问", 404);
    if (request.method !== "GET") {
      const app = getAgentHubDatabase()
        .prepare("SELECT producer FROM applications WHERE id=?")
        .get(decodeURIComponent(tail[0])) as { producer: string } | undefined;
      if (app?.producer !== "appfactory" || tail.length > 1)
        requirePermission(user, "applications.manage");
    }
    return;
  }
  if (path.startsWith("/api/appfactory/v1/")) {
    requirePermission(user, "appfactory.use");
    const parts = path
      .slice("/api/appfactory/v1/".length)
      .split("/")
      .map(decodeURIComponent);
    if (parts[0] === "settings")
      return requirePermission(user, "platform.manage");
    if (parts.includes("capabilities"))
      requirePermission(user, "platform.manage");
    const tables = new Map([
      ["projects", "projects"],
      ["sessions", "sessions"],
      ["runs", "runs"],
      ["publication-jobs", "publication_jobs"],
    ]);
    const table = tables.get(parts[0]);
    if (!table && !["templates", "runtime", "settings"].includes(parts[0]))
      throw new AuthError("接口尚未开放");
    if (table && parts[1]) {
      const db = getAppFactoryDatabase();
      const row =
        table === "projects"
          ? db.prepare("SELECT owner_id FROM projects WHERE id=?").get(parts[1])
          : db
              .prepare(
                `SELECT p.owner_id FROM ${table} r JOIN projects p ON p.id=r.project_id WHERE r.id=?`,
              )
              .get(parts[1]);
      if (!row || (row as { owner_id: string }).owner_id !== user.id)
        throw new AuthError("项目不存在或无权访问", 404);
    }
    return;
  }
  if (
    path.startsWith("/api/knowhub/") ||
    path.startsWith("/api/platform/skills/") ||
    path.startsWith("/api/agenthub/v1/")
  )
    return requirePermission(user, "platform.manage");
  throw new AuthError("接口尚未开放");
}

export function withApiAuth<T extends (...args: never[]) => unknown>(
  handler: T,
): T {
  return (async (request: Request, ...args: unknown[]) => {
    try {
      checkRequestOrigin(request);
      const user = readSession(sessionToken(request));
      if (!user) return apiError("请先登录", 401);
      authorizeApiRequest(request, user);
      const response = await runAsUser(user, () =>
        (
          handler as unknown as (
            request: Request,
            ...args: unknown[]
          ) => Response | Promise<Response>
        )(request, ...args),
      );
      return protectEventStream(response, request);
    } catch (error) {
      if (error instanceof AuthError)
        return apiError(error.message, error.status);
      if (error instanceof SyntaxError)
        return apiError("请求数据格式无效", 422);
      console.error("API 请求失败", error);
      return apiError("请求处理失败", 500);
    }
  }) as unknown as T;
}

function protectEventStream(response: Response, request: Request) {
  if (
    !response.body ||
    !response.headers.get("content-type")?.includes("text/event-stream")
  )
    return response;
  const reader = response.body.getReader();
  let timer: ReturnType<typeof setInterval>;
  let closed = false;
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      timer = setInterval(() => {
        try {
          const user = readSession(sessionToken(request));
          if (!user) throw new AuthError("会话失效", 401);
          authorizeApiRequest(request, user);
        } catch {
          if (!closed) {
            closed = true;
            clearInterval(timer);
            controller.close();
            void reader.cancel();
          }
        }
      }, 15_000);
    },
    async pull(controller) {
      try {
        const chunk = await reader.read();
        if (closed) return;
        if (chunk.done) {
          closed = true;
          clearInterval(timer);
          controller.close();
        } else controller.enqueue(chunk.value);
      } catch (error) {
        if (!closed) {
          closed = true;
          clearInterval(timer);
          controller.error(error);
        }
      }
    },
    cancel() {
      closed = true;
      clearInterval(timer);
      return reader.cancel();
    },
  });
  return new Response(body, {
    status: response.status,
    headers: response.headers,
  });
}
