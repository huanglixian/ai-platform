import { NextResponse } from "next/server";
import { z } from "zod";
import { getAgentHubDatabase } from "@/lib/agenthub/database";
import { checkRequestOrigin } from "@/features/auth/api";
import { AuthError } from "@/features/auth/errors";
import { verifyPassword } from "@/features/auth/password";
import {
  createSession,
  readPrincipal,
  sessionCookie,
  sessionLifetime,
  tokenHash,
} from "@/features/auth/session";
import { audit } from "@/features/access/server";
import { apiError } from "@/lib/server/api-response";

const schema = z.object({
  username: z.string().trim().min(1).max(64),
  password: z.string().min(1).max(128),
});
let pending = 0;

export async function POST(request: Request) {
  try {
    checkRequestOrigin(request);
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "请求无效", 403);
  }
  if (pending >= 3) return apiError("登录请求较多，请稍后重试", 429);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("请输入有效的账号和密码", 422);
  const db = getAgentHubDatabase();
  const key = tokenHash(parsed.data.username.toLowerCase());
  const now = Date.now();
  const attempt = db
    .prepare(
      "SELECT attempts,reset_at FROM platform_login_attempts WHERE account_key=?",
    )
    .get(key) as { attempts: number; reset_at: number } | undefined;
  if (attempt && attempt.reset_at > now && attempt.attempts >= 8)
    return apiError("尝试次数过多，请 15 分钟后重试", 429);
  db.prepare("DELETE FROM platform_login_attempts WHERE reset_at<=?").run(now);
  db.prepare(
    "INSERT INTO platform_login_attempts(account_key,attempts,reset_at) VALUES (?,1,?) ON CONFLICT(account_key) DO UPDATE SET attempts=attempts+1",
  ).run(key, now + 15 * 60_000);
  pending += 1;
  try {
    const row = db
      .prepare(
        "SELECT id,password_hash,status FROM platform_users WHERE username=?",
      )
      .get(parsed.data.username) as
      | { id: string; password_hash: string; status: string }
      | undefined;
    const dummy = `scrypt:131072:8:1:${"0".repeat(48)}:${"0".repeat(128)}`;
    const valid = await verifyPassword(
      parsed.data.password,
      row?.password_hash ?? dummy,
    );
    const latest = row
      ? (db
          .prepare("SELECT password_hash,status FROM platform_users WHERE id=?")
          .get(row.id) as { password_hash: string; status: string } | undefined)
      : undefined;
    const user =
      row &&
      valid &&
      latest?.status === "active" &&
      latest.password_hash === row.password_hash
        ? readPrincipal(row.id)
        : null;
    if (!user) return apiError("账号或密码错误", 401);
    db.prepare("DELETE FROM platform_login_attempts WHERE account_key=?").run(
      key,
    );
    const response = NextResponse.json(
      { data: user },
      { headers: { "Cache-Control": "no-store" } },
    );
    response.cookies.set(sessionCookie, createSession(user.id), {
      httpOnly: true,
      sameSite: "strict",
      secure: new URL(request.url).protocol === "https:",
      path: "/",
      maxAge: sessionLifetime,
    });
    audit(user.id, "auth.login", user.id);
    return response;
  } catch (error) {
    if (error instanceof AuthError)
      return apiError(error.message, error.status);
    console.error("登录失败", error);
    return apiError("登录服务暂不可用", 500);
  } finally {
    pending -= 1;
  }
}
