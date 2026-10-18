import { createHash, randomBytes } from "node:crypto";
import { getAgentHubDatabase } from "@/lib/agenthub/database";
import type { Permission, Principal, RoleCode } from "./types";

export const sessionCookie = "ai_platform_session";
export const sessionLifetime = 12 * 60 * 60;
export function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function readPrincipal(id: string): Principal | null {
  const db = getAgentHubDatabase();
  const user = db
    .prepare(
      "SELECT id,username,display_name AS displayName FROM platform_users WHERE id=? AND status='active'",
    )
    .get(id) as Omit<Principal, "roles" | "permissions"> | undefined;
  if (!user) return null;
  const roles = db
    .prepare(
      "SELECT role_code FROM platform_user_roles WHERE user_id=? ORDER BY role_code",
    )
    .all(id) as { role_code: RoleCode }[];
  const permissions = db
    .prepare(
      "SELECT DISTINCT p.permission FROM platform_role_permissions p JOIN platform_user_roles ur ON ur.role_code=p.role_code WHERE ur.user_id=?",
    )
    .all(id) as { permission: Permission }[];
  return {
    ...user,
    roles: roles.map((r) => r.role_code),
    permissions: permissions.map((p) => p.permission),
  };
}

export function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const db = getAgentHubDatabase();
  db.prepare("DELETE FROM platform_sessions WHERE expires_at<=?").run(
    Date.now(),
  );
  db.prepare(
    "INSERT INTO platform_sessions(token_hash,user_id,expires_at,created_at) VALUES (?,?,?,?)",
  ).run(
    tokenHash(token),
    userId,
    Date.now() + sessionLifetime * 1000,
    new Date().toISOString(),
  );
  return token;
}

export function readSession(token: string | undefined): Principal | null {
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const session = getAgentHubDatabase()
    .prepare(
      "SELECT user_id FROM platform_sessions WHERE token_hash=? AND expires_at>?",
    )
    .get(tokenHash(token), Date.now()) as { user_id: string } | undefined;
  return session ? readPrincipal(session.user_id) : null;
}

export function sessionToken(request: Request) {
  return request.headers
    .get("cookie")
    ?.split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${sessionCookie}=`))
    ?.slice(sessionCookie.length + 1);
}
export function deleteSession(token: string | undefined) {
  if (token)
    getAgentHubDatabase()
      .prepare("DELETE FROM platform_sessions WHERE token_hash=?")
      .run(tokenHash(token));
}
export function revokeUserSessions(userId: string) {
  getAgentHubDatabase()
    .prepare("DELETE FROM platform_sessions WHERE user_id=?")
    .run(userId);
}
