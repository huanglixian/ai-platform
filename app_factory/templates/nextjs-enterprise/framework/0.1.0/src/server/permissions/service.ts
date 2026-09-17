import { invalidateUserSessions } from "../auth/session.ts";
import type { Principal } from "../auth/types.ts";
import { conflict, forbidden, notFound, badRequest } from "../errors/app-error.ts";
import { getDepartmentAndChildrenIds } from "../organization/service.ts";
import { appTable, getDatabasePool, transaction } from "../db/database.ts";
import { listPermissionDefinitions } from "./registry.ts";
import { isDataScope, type CustomPolicy, type DataScope, type ResourceAccess } from "./types.ts";

export type RoleGrant = {
  permissionCode: string;
  dataScope: DataScope;
};

export type RoleSummary = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  system: boolean;
  userCount: number;
};

export type RoleDetail = RoleSummary & {
  grants: RoleGrant[];
};

type RoleRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_system: boolean;
  user_count: string;
};

function presentRole(row: RoleRow): RoleSummary {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    system: row.is_system,
    userCount: Number(row.user_count),
  };
}

function assertRoleCode(code: string) {
  if (!/^[a-z][a-z0-9_]{2,60}$/.test(code)) throw badRequest("角色编码只能使用小写字母、数字和下划线");
  return code;
}

function assertRoleId(roleId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(roleId)) throw notFound("角色不存在");
  return roleId;
}

function normalizeRoleInput(input: { name: string; description?: string | null; grants: RoleGrant[] }) {
  const name = input.name.trim();
  if (!name || name.length > 120) throw badRequest("角色名称长度必须在 1 到 120 个字符之间");
  const description = input.description?.trim() || null;
  if (description && description.length > 500) throw badRequest("角色说明不能超过 500 个字符");
  const permissions = new Set<string>();
  for (const grant of input.grants) {
    if (!grant || typeof grant.permissionCode !== "string" || !grant.permissionCode) {
      throw badRequest("角色权限无效");
    }
    if (!isDataScope(grant.dataScope)) throw badRequest(`数据范围无效：${grant.permissionCode}`);
    if (permissions.has(grant.permissionCode)) throw badRequest(`权限重复：${grant.permissionCode}`);
    permissions.add(grant.permissionCode);
  }
  return { name, description, grants: input.grants };
}

async function assertKnownPermissions(codes: string[]) {
  if (!codes.length) return;
  const definitions = await listPermissionDefinitions();
  const known = new Set(definitions.map((definition) => definition.code));
  const unknown = codes.find((code) => !known.has(code));
  if (unknown) throw badRequest(`权限未注册：${unknown}`);
}

export async function listRoles() {
  const result = await getDatabasePool().query<RoleRow>(
    `SELECT roles.id, roles.code, roles.name, roles.description, roles.is_system,
            COUNT(user_roles.user_id)::text AS user_count
       FROM ${appTable("app_roles")} roles
       LEFT JOIN ${appTable("app_user_roles")} user_roles ON user_roles.role_id=roles.id
      GROUP BY roles.id, roles.code, roles.name, roles.description, roles.is_system
      ORDER BY roles.is_system DESC, roles.name`,
  );
  return result.rows.map(presentRole);
}

export async function getRoleDetail(roleId: string): Promise<RoleDetail | null> {
  const result = await getDatabasePool().query<RoleRow>(
    `SELECT roles.id, roles.code, roles.name, roles.description, roles.is_system,
            COUNT(user_roles.user_id)::text AS user_count
       FROM ${appTable("app_roles")} roles
       LEFT JOIN ${appTable("app_user_roles")} user_roles ON user_roles.role_id=roles.id
      WHERE roles.id=$1
      GROUP BY roles.id, roles.code, roles.name, roles.description, roles.is_system`,
    [assertRoleId(roleId)],
  );
  const role = result.rows[0];
  if (!role) return null;
  const grants = await getDatabasePool().query<{ permission_code: string; data_scope: DataScope }>(
    `SELECT permission_code, data_scope FROM ${appTable("app_role_permissions")}
      WHERE role_id=$1 ORDER BY permission_code`,
    [role.id],
  );
  return {
    ...presentRole(role),
    grants: grants.rows.map((grant) => ({
      permissionCode: grant.permission_code,
      dataScope: grant.data_scope,
    })),
  };
}

export async function createRole(input: { code: string; name: string; description?: string | null; grants?: RoleGrant[] }) {
  const normalized = normalizeRoleInput({
    name: input.name,
    description: input.description,
    grants: input.grants || [],
  });
  const code = assertRoleCode(input.code);
  await assertKnownPermissions(normalized.grants.map((grant) => grant.permissionCode));
  const roleId = await transaction(async (client) => {
    const created = await client.query<{ id: string }>(
      `INSERT INTO ${appTable("app_roles")} (id, code, name, description, is_system)
       VALUES ($1, $2, $3, $4, false)
       RETURNING id`,
      [crypto.randomUUID(), code, normalized.name, normalized.description],
    );
    for (const grant of normalized.grants) {
      await client.query(
        `INSERT INTO ${appTable("app_role_permissions")} (role_id, permission_code, data_scope)
         VALUES ($1, $2, $3)`,
        [created.rows[0]!.id, grant.permissionCode, grant.dataScope],
      );
    }
    return created.rows[0]!.id;
  });
  return getRoleDetail(roleId);
}

export async function updateRole(
  roleId: string,
  input: { name: string; description?: string | null; grants: RoleGrant[] },
) {
  const normalized = normalizeRoleInput(input);
  await assertKnownPermissions(normalized.grants.map((grant) => grant.permissionCode));
  await transaction(async (client) => {
    const existing = await client.query<{ id: string }>(
      `SELECT id FROM ${appTable("app_roles")} WHERE id=$1 FOR UPDATE`,
      [assertRoleId(roleId)],
    );
    if (!existing.rows[0]) throw notFound("角色不存在");
    await client.query(
      `UPDATE ${appTable("app_roles")} SET name=$2, description=$3, updated_at=NOW() WHERE id=$1`,
      [roleId, normalized.name, normalized.description],
    );
    await client.query(`DELETE FROM ${appTable("app_role_permissions")} WHERE role_id=$1`, [roleId]);
    for (const grant of normalized.grants) {
      await client.query(
        `INSERT INTO ${appTable("app_role_permissions")} (role_id, permission_code, data_scope)
         VALUES ($1, $2, $3)`,
        [roleId, grant.permissionCode, grant.dataScope],
      );
    }
  });
  return getRoleDetail(roleId);
}

export async function assignRolesToUser(userId: string, roleIds: string[]) {
  const uniqueRoleIds = [...new Set(roleIds.map(assertRoleId))];
  await transaction(async (client) => {
    const user = await client.query<{ id: string; is_active: boolean }>(
      `SELECT id, is_active FROM ${appTable("app_users")} WHERE id=$1 FOR UPDATE`,
      [userId],
    );
    if (!user.rows[0]) throw notFound("用户不存在");
    const roles = await client.query<{ id: string; code: string }>(
      `SELECT id, code FROM ${appTable("app_roles")} WHERE id = ANY($1::text[])`,
      [uniqueRoleIds],
    );
    if (roles.rowCount !== uniqueRoleIds.length) throw badRequest("包含不存在的角色");
    const current = await client.query<{ code: string }>(
      `SELECT roles.code FROM ${appTable("app_user_roles")} user_roles
       JOIN ${appTable("app_roles")} roles ON roles.id=user_roles.role_id
       WHERE user_roles.user_id=$1`,
      [userId],
    );
    const losesLastAdmin = user.rows[0].is_active
      && current.rows.some((role) => role.code === "super_admin")
      && !roles.rows.some((role) => role.code === "super_admin");
    if (losesLastAdmin) {
      const remaining = await client.query<{ count: string }>(
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
    await client.query(`DELETE FROM ${appTable("app_user_roles")} WHERE user_id=$1`, [userId]);
    for (const role of roles.rows) {
      await client.query(
        `INSERT INTO ${appTable("app_user_roles")} (user_id, role_id) VALUES ($1, $2)`,
        [userId, role.id],
      );
    }
  });
  await invalidateUserSessions(userId);
}

export async function scopesForPermission(principal: Principal, permissionCode: string): Promise<DataScope[]> {
  if (principal.roleCodes.includes("super_admin")) return ["all"];
  const result = await getDatabasePool().query<{ data_scope: DataScope }>(
    `SELECT DISTINCT role_permissions.data_scope
       FROM ${appTable("app_user_roles")} user_roles
       JOIN ${appTable("app_role_permissions")} role_permissions ON role_permissions.role_id=user_roles.role_id
      WHERE user_roles.user_id=$1 AND role_permissions.permission_code=$2`,
    [principal.userId, permissionCode],
  );
  return result.rows.map((row) => row.data_scope).filter(isDataScope);
}

export async function requirePermission(principal: Principal, permissionCode: string) {
  const scopes = await scopesForPermission(principal, permissionCode);
  if (!scopes.length) throw forbidden("没有执行此操作的权限");
  return scopes;
}

export async function canAccessResource<T extends ResourceAccess>(
  principal: Principal,
  permissionCode: string,
  resource: T,
  customPolicy?: CustomPolicy<T>,
) {
  const scopes = await requirePermission(principal, permissionCode);
  if (scopes.includes("all")) return true;
  if (scopes.includes("self") && resource.ownerUserId === principal.userId) return true;
  if (
    scopes.includes("department")
    && principal.primaryDepartmentId
    && resource.ownerDepartmentId === principal.primaryDepartmentId
  ) return true;
  if (scopes.includes("department_and_children") && principal.primaryDepartmentId && resource.ownerDepartmentId) {
    const departmentIds = await getDepartmentAndChildrenIds(principal.primaryDepartmentId);
    if (departmentIds.includes(resource.ownerDepartmentId)) return true;
  }
  if (scopes.includes("custom") && customPolicy && await customPolicy({ principal, resource })) return true;
  return false;
}
