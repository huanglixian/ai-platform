import { createHmac, timingSafeEqual } from "node:crypto";

import { unauthorized } from "../errors/app-error.ts";
import { getRuntimeConfig } from "../env/runtime-config.ts";
import { appTable, query } from "../db/database.ts";
import type { Principal } from "./types.ts";

const sessionCookieName = "app_session";

function signSession(id: string) {
  return createHmac("sha256", getRuntimeConfig().authSecret)
    .update(id)
    .digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftValue = Buffer.from(left);
  const rightValue = Buffer.from(right);
  return leftValue.length === rightValue.length && timingSafeEqual(leftValue, rightValue);
}

function parseCookies(value: string) {
  return Object.fromEntries(
    value
      .split(";")
      .map((entry) => entry.trim().split("=", 2))
      .filter(([name, item]) => Boolean(name && item))
      .map(([name, item]) => [name, decodeURIComponent(item)]),
  );
}

function sessionIdFromValue(value?: string | null) {
  if (!value) return null;
  const [sessionId, signature] = value.split(".", 2);
  if (!sessionId || !signature || !safeEqual(signature, signSession(sessionId))) return null;
  return sessionId;
}

function createSessionCookie(sessionId: string) {
  const { sessionTtlSeconds } = getRuntimeConfig();
  const secure = process.env.APP_SECURE_COOKIES === "true" ? "; Secure" : "";
  return `${sessionCookieName}=${sessionId}.${signSession(sessionId)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${sessionTtlSeconds}${secure}`;
}

type PrincipalRow = {
  userId: string;
  username: string;
  displayName: string;
  primaryDepartmentId: string | null;
  roleCodes: string[] | null;
};

export async function getPrincipalBySessionId(sessionId: string): Promise<Principal | null> {
  const result = await query<PrincipalRow>(
    `SELECT users.id AS "userId", users.username AS "username", users.display_name AS "displayName",
            users.primary_department_id AS "primaryDepartmentId",
            COALESCE(array_agg(roles.code) FILTER (WHERE roles.code IS NOT NULL), ARRAY[]::text[]) AS "roleCodes"
       FROM ${appTable("app_sessions")} sessions
       JOIN ${appTable("app_users")} users ON users.id=sessions.user_id
       LEFT JOIN ${appTable("app_user_roles")} user_roles ON user_roles.user_id=users.id
       LEFT JOIN ${appTable("app_roles")} roles ON roles.id=user_roles.role_id
      WHERE sessions.id=$1 AND sessions.expires_at>NOW() AND users.is_active=true
      GROUP BY users.id, users.username, users.display_name, users.primary_department_id`,
    [sessionId],
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    userId: row.userId,
    username: row.username,
    displayName: row.displayName,
    primaryDepartmentId: row.primaryDepartmentId,
    roleCodes: row.roleCodes || [],
  };
}

export async function currentPrincipal(request: Request) {
  const cookies = parseCookies(request.headers.get("cookie") || "");
  const sessionId = sessionIdFromValue(cookies[sessionCookieName]);
  return sessionId ? getPrincipalBySessionId(sessionId) : null;
}

export async function currentPrincipalFromCookie(value?: string | null) {
  const sessionId = sessionIdFromValue(value);
  return sessionId ? getPrincipalBySessionId(sessionId) : null;
}

export async function requirePrincipal(request: Request) {
  const principal = await currentPrincipal(request);
  if (!principal) throw unauthorized();
  return principal;
}

export async function createSession(userId: string) {
  const sessionId = crypto.randomUUID();
  await query(
    `INSERT INTO ${appTable("app_sessions")} (id, user_id, expires_at)
     VALUES ($1, $2, NOW() + ($3 * INTERVAL '1 second'))`,
    [sessionId, userId, getRuntimeConfig().sessionTtlSeconds],
  );
  return createSessionCookie(sessionId);
}

export async function invalidateUserSessions(userId: string) {
  await query(`DELETE FROM ${appTable("app_sessions")} WHERE user_id=$1`, [userId]);
}

export async function logout(request: Request) {
  const cookies = parseCookies(request.headers.get("cookie") || "");
  const sessionId = sessionIdFromValue(cookies[sessionCookieName]);
  if (sessionId) await query(`DELETE FROM ${appTable("app_sessions")} WHERE id=$1`, [sessionId]);
}

export function clearSessionCookie() {
  return `${sessionCookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
