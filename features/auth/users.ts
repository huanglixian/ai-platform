import { z } from "zod";
import { getAgentHubDatabase } from "@/lib/agenthub/database";
import { getAppFactoryDatabase } from "@/app_factory/server/database";
import { audit } from "@/features/access/server";
import { AuthError } from "./errors";
import { hashPassword } from "./password";
import { revokeUserSessions } from "./session";

const roleSchema = z.enum([
  "super_admin",
  "app_admin",
  "internal_user",
  "external_user",
]);
const rolesSchema = z
  .array(roleSchema)
  .min(1)
  .max(4)
  .refine(
    (roles) => !roles.includes("external_user") || roles.length === 1,
    "外部用户不能同时分配内部角色",
  );
export const passwordSchema = z
  .string()
  .min(8, "密码至少 8 位")
  .max(128, "密码最多 128 位");
export const userInputSchema = z.object({
  username: z
    .string()
    .trim()
    .regex(
      /^[a-zA-Z0-9][a-zA-Z0-9_.-]{2,63}$/,
      "账号为 3–64 位字母、数字、下划线、点或短横线",
    )
    .transform((value) => value.toLowerCase()),
  displayName: z.string().trim().min(1).max(80),
  password: passwordSchema,
  roles: rolesSchema.default(["internal_user"]),
});
export const userUpdateSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  status: z.enum(["active", "disabled"]),
  roles: rolesSchema,
});

export function listUsers() {
  const db = getAgentHubDatabase();
  return (
    db
      .prepare(
        "SELECT id,username,display_name AS displayName,status,created_at AS createdAt FROM platform_users ORDER BY created_at",
      )
      .all() as {
      id: string;
      username: string;
      displayName: string;
      status: string;
      createdAt: string;
    }[]
  ).map((user) => ({
    ...user,
    roles: (
      db
        .prepare(
          "SELECT role_code FROM platform_user_roles WHERE user_id=? ORDER BY role_code",
        )
        .all(user.id) as { role_code: string }[]
    ).map((role) => role.role_code),
  }));
}

export function userPasswordHash(id: string) {
  return (
    getAgentHubDatabase()
      .prepare("SELECT password_hash FROM platform_users WHERE id=?")
      .get(id) as { password_hash: string } | undefined
  )?.password_hash;
}

export function listRoles() {
  const db = getAgentHubDatabase();
  return (
    db
      .prepare(
        "SELECT code,name,description FROM platform_roles ORDER BY rowid",
      )
      .all() as { code: string; name: string; description: string }[]
  ).map((role) => ({
    ...role,
    permissions: (
      db
        .prepare(
          "SELECT permission FROM platform_role_permissions WHERE role_code=?",
        )
        .all(role.code) as { permission: string }[]
    ).map((row) => row.permission),
    memberCount: (
      db
        .prepare(
          "SELECT COUNT(*) AS count FROM platform_user_roles WHERE role_code=?",
        )
        .get(role.code) as { count: number }
    ).count,
  }));
}

export async function createUser(
  input: z.infer<typeof userInputSchema>,
  actorId: string,
) {
  const db = getAgentHubDatabase();
  const passwordHash = await hashPassword(input.password);
  const id = `user-${crypto.randomUUID()}`;
  db.transaction(() => {
    if (
      db
        .prepare("SELECT 1 FROM platform_users WHERE username=?")
        .get(input.username)
    )
      throw new AuthError("账号已存在", 409);
    const now = new Date().toISOString();
    db.prepare(
      "INSERT INTO platform_users(id,username,display_name,password_hash,created_at,updated_at) VALUES (?,?,?,?,?,?)",
    ).run(id, input.username, input.displayName, passwordHash, now, now);
    for (const role of new Set(input.roles))
      db.prepare(
        "INSERT INTO platform_user_roles(user_id,role_code) VALUES (?,?)",
      ).run(id, role);
    audit(actorId, "user.create", id, { roles: input.roles });
  })();
  return { id };
}

function protectLastAdmin(id: string, remainsAdmin: boolean) {
  const db = getAgentHubDatabase();
  const isAdmin = db
    .prepare(
      "SELECT 1 FROM platform_user_roles r JOIN platform_users u ON u.id=r.user_id WHERE u.id=? AND u.status='active' AND r.role_code='super_admin'",
    )
    .get(id);
  if (!isAdmin || remainsAdmin) return;
  const count = db
    .prepare(
      "SELECT COUNT(*) AS count FROM platform_user_roles r JOIN platform_users u ON u.id=r.user_id WHERE u.status='active' AND r.role_code='super_admin'",
    )
    .get() as { count: number };
  if (count.count <= 1)
    throw new AuthError("必须保留至少一个启用的超级管理员", 409);
}

export function updateUser(
  id: string,
  input: z.infer<typeof userUpdateSchema>,
  actorId: string,
) {
  const db = getAgentHubDatabase();
  db.transaction(() => {
    if (!db.prepare("SELECT 1 FROM platform_users WHERE id=?").get(id))
      throw new AuthError("用户不存在", 404);
    protectLastAdmin(
      id,
      input.status === "active" && input.roles.includes("super_admin"),
    );
    db.prepare(
      "UPDATE platform_users SET display_name=?,status=?,updated_at=? WHERE id=?",
    ).run(input.displayName, input.status, new Date().toISOString(), id);
    db.prepare("DELETE FROM platform_user_roles WHERE user_id=?").run(id);
    for (const role of new Set(input.roles))
      db.prepare(
        "INSERT INTO platform_user_roles(user_id,role_code) VALUES (?,?)",
      ).run(id, role);
    revokeUserSessions(id);
    audit(actorId, "user.update", id, {
      status: input.status,
      roles: input.roles,
    });
  })();
}

export function deleteUser(id: string, actorId: string) {
  const db = getAgentHubDatabase();
  if (id === actorId) throw new AuthError("不能删除当前登录账号", 409);
  db.transaction(() => {
    if (!db.prepare("SELECT 1 FROM platform_users WHERE id=?").get(id))
      throw new AuthError("用户不存在", 404);
    protectLastAdmin(id, false);
    if (
      db
        .prepare("SELECT 1 FROM resource_policies WHERE owner_id=? LIMIT 1")
        .get(id) ||
      getAppFactoryDatabase()
        .prepare("SELECT 1 FROM projects WHERE owner_id=? LIMIT 1")
        .get(id)
    )
      throw new AuthError("该用户拥有应用或项目，请先停用账号或转移资源", 409);
    db.prepare("DELETE FROM platform_users WHERE id=?").run(id);
    audit(actorId, "user.delete", id);
  })();
}

export async function resetPassword(
  id: string,
  password: string,
  actorId: string,
) {
  const hash = await hashPassword(password);
  const db = getAgentHubDatabase();
  db.transaction(() => {
    if (
      !db
        .prepare(
          "UPDATE platform_users SET password_hash=?,updated_at=? WHERE id=?",
        )
        .run(hash, new Date().toISOString(), id).changes
    )
      throw new AuthError("用户不存在", 404);
    revokeUserSessions(id);
    audit(actorId, "user.password_reset", id);
  })();
}
