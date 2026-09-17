import { timingSafeEqual } from "node:crypto";

import { recordAudit } from "../audit/service.ts";
import { appTable, getDatabasePool, query, transaction } from "../db/database.ts";
import { getBootstrapToken } from "../env/runtime-config.ts";
import { badRequest, conflict, notFound, unauthorized } from "../errors/app-error.ts";
import { assertDepartmentExists, ensureRootDepartment } from "../organization/service.ts";
import { createSession, invalidateUserSessions } from "./session.ts";
import { hashPassword, passwordMatches, validUsername } from "./password.ts";
import type { Principal, UserSummary } from "./types.ts";

type UserRow = {
  id: string;
  username: string;
  display_name: string;
  password_hash: string;
  primary_department_id: string | null;
  is_active: boolean;
};

function validateUserInput(input: { username: string; password: string; displayName?: string | null }) {
  if (!validUsername(input.username)) {
    throw badRequest("username 只能使用 3 到 80 位字母、数字、点、下划线或连字符");
  }
  if (input.password.length < 12 || input.password.length > 256) {
    throw badRequest("password 长度必须在 12 到 256 个字符之间");
  }
  const displayName = input.displayName?.trim() || input.username;
  if (displayName.length > 120) throw badRequest("显示名称不能超过 120 个字符");
  return { username: input.username, password: input.password, displayName };
}

export function assertBootstrapToken(request: Request) {
  const received = Buffer.from(request.headers.get("x-enterprise-bootstrap-token") || "");
  const expected = Buffer.from(getBootstrapToken());
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    throw unauthorized("Bootstrap 凭证无效");
  }
}

async function principalForUser(userId: string): Promise<Principal | null> {
  const result = await query<{
    userId: string;
    username: string;
    displayName: string;
    primaryDepartmentId: string | null;
    roleCodes: string[] | null;
  }>(
    `SELECT users.id AS "userId", users.username, users.display_name AS "displayName",
            users.primary_department_id AS "primaryDepartmentId",
            COALESCE(array_agg(roles.code) FILTER (WHERE roles.code IS NOT NULL), ARRAY[]::text[]) AS "roleCodes"
       FROM ${appTable("app_users")} users
       LEFT JOIN ${appTable("app_user_roles")} user_roles ON user_roles.user_id=users.id
       LEFT JOIN ${appTable("app_roles")} roles ON roles.id=user_roles.role_id
      WHERE users.id=$1 AND users.is_active=true
      GROUP BY users.id, users.username, users.display_name, users.primary_department_id`,
    [userId],
  );
  const row = result.rows[0];
  return row ? {
    userId: row.userId,
    username: row.username,
    displayName: row.displayName,
    primaryDepartmentId: row.primaryDepartmentId,
    roleCodes: row.roleCodes || [],
  } : null;
}

export async function bootstrapInitialAdministrator(input: {
  username: string;
  password: string;
  displayName?: string | null;
}) {
  const user = validateUserInput(input);
  const passwordHash = await hashPassword(user.password);
  const createdUserId = await transaction(async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", ["app-bootstrap"]);
    const existing = await client.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM ${appTable("app_users")}`,
    );
    if (Number(existing.rows[0]?.count || 0) > 0) {
      throw conflict("内部用户已初始化，Bootstrap 不可重复执行");
    }
    const rootDepartment = await ensureRootDepartment(client);
    const role = await client.query<{ id: string }>(
      `SELECT id FROM ${appTable("app_roles")} WHERE code='super_admin'`,
    );
    if (!role.rows[0]) throw new Error("缺少 super_admin 初始角色");
    const created = await client.query<{ id: string }>(
      `INSERT INTO ${appTable("app_users")}
        (id, username, display_name, password_hash, primary_department_id, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id`,
      [crypto.randomUUID(), user.username, user.displayName, passwordHash, rootDepartment.id],
    );
    await client.query(
      `INSERT INTO ${appTable("app_user_roles")} (user_id, role_id) VALUES ($1, $2)`,
      [created.rows[0]!.id, role.rows[0].id],
    );
    await recordAudit(client, {
      action: "system.bootstrap",
      entityType: "user",
      entityId: created.rows[0]!.id,
      details: { username: user.username },
      dedupeKey: "system:bootstrap",
    });
    return created.rows[0]!.id;
  });
  return principalForUser(createdUserId);
}

export async function authenticate(username: string, password: string) {
  const result = await query<UserRow>(
    `SELECT id, username, display_name, password_hash, primary_department_id, is_active
       FROM ${appTable("app_users")} WHERE username=$1`,
    [username.trim()],
  );
  const user = result.rows[0];
  if (!user || !user.is_active || !await passwordMatches(password, user.password_hash)) {
    throw unauthorized("用户名或密码错误");
  }
  const principal = await principalForUser(user.id);
  if (!principal) throw unauthorized("用户已停用");
  return { principal, cookie: await createSession(user.id) };
}

export async function listUsers(search?: string) {
  const keyword = search?.trim() || "";
  const result = await getDatabasePool().query<{
    id: string;
    username: string;
    display_name: string;
    primary_department_id: string | null;
    primary_department_name: string | null;
    is_active: boolean;
    role_codes: string[] | null;
    created_at: string;
  }>(
    `SELECT users.id, users.username, users.display_name, users.primary_department_id,
            departments.name AS primary_department_name, users.is_active,
            COALESCE(array_agg(roles.code) FILTER (WHERE roles.code IS NOT NULL), ARRAY[]::text[]) AS role_codes,
            users.created_at
       FROM ${appTable("app_users")} users
       LEFT JOIN ${appTable("app_departments")} departments ON departments.id=users.primary_department_id
       LEFT JOIN ${appTable("app_user_roles")} user_roles ON user_roles.user_id=users.id
       LEFT JOIN ${appTable("app_roles")} roles ON roles.id=user_roles.role_id
      WHERE ($1='' OR users.username ILIKE '%' || $1 || '%' OR users.display_name ILIKE '%' || $1 || '%')
      GROUP BY users.id, users.username, users.display_name, users.primary_department_id,
               departments.name, users.is_active, users.created_at
      ORDER BY users.created_at DESC`,
    [keyword],
  );
  return result.rows.map((row): UserSummary => ({
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    primaryDepartmentId: row.primary_department_id,
    primaryDepartmentName: row.primary_department_name,
    active: row.is_active,
    roleCodes: row.role_codes || [],
    createdAt: row.created_at,
  }));
}

export async function createUser(input: {
  username: string;
  password: string;
  displayName?: string | null;
  primaryDepartmentId: string | null;
  roleIds: string[];
}) {
  const user = validateUserInput(input);
  if (!input.roleIds.length) throw badRequest("至少需要分配一个角色");
  const passwordHash = await hashPassword(user.password);
  return transaction(async (client) => {
    await assertDepartmentExists(input.primaryDepartmentId, client);
    const roles = await client.query<{ id: string }>(
      `SELECT id FROM ${appTable("app_roles")} WHERE id = ANY($1::text[])`,
      [[...new Set(input.roleIds)]],
    );
    if (roles.rowCount !== new Set(input.roleIds).size) throw badRequest("包含不存在的角色");
    const created = await client.query<{ id: string }>(
      `INSERT INTO ${appTable("app_users")}
        (id, username, display_name, password_hash, primary_department_id, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id`,
      [crypto.randomUUID(), user.username, user.displayName, passwordHash, input.primaryDepartmentId],
    );
    for (const role of roles.rows) {
      await client.query(
        `INSERT INTO ${appTable("app_user_roles")} (user_id, role_id) VALUES ($1, $2)`,
        [created.rows[0]!.id, role.id],
      );
    }
    return created.rows[0]!.id;
  });
}

export async function setUserActive(userId: string, active: boolean) {
  if (!active) {
    const target = await getDatabasePool().query<{ is_super_admin: boolean }>(
      `SELECT EXISTS(
         SELECT 1 FROM ${appTable("app_user_roles")} user_roles
         JOIN ${appTable("app_roles")} roles ON roles.id=user_roles.role_id
        WHERE user_roles.user_id=$1 AND roles.code='super_admin'
       ) AS is_super_admin`,
      [userId],
    );
    if (!target.rows[0]) throw notFound("用户不存在");
    if (target.rows[0].is_super_admin) {
      const remaining = await getDatabasePool().query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM ${appTable("app_users")} users
         JOIN ${appTable("app_user_roles")} user_roles ON user_roles.user_id=users.id
         JOIN ${appTable("app_roles")} roles ON roles.id=user_roles.role_id
        WHERE users.is_active=true AND roles.code='super_admin' AND users.id<>$1`,
        [userId],
      );
      if (Number(remaining.rows[0]?.count || 0) === 0) {
        throw conflict("至少需要保留一个有效超级管理员");
      }
    }
  }
  const updated = await query(
    `UPDATE ${appTable("app_users")} SET is_active=$2, updated_at=NOW() WHERE id=$1`,
    [userId, active],
  );
  if (!updated.rowCount) throw notFound("用户不存在");
  await invalidateUserSessions(userId);
}
