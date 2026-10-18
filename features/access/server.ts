import { getAgentHubDatabase } from "@/lib/agenthub/database";
import { AuthError } from "@/features/auth/errors";
import { hasPermission, type Principal } from "@/features/auth/types";
import type { ResourcePolicy, Visibility } from "./types";

export function getResourcePolicy(type: string, id: string) {
  return getAgentHubDatabase()
    .prepare(
      "SELECT owner_id AS ownerId,visibility,revision FROM resource_policies WHERE resource_type=? AND resource_id=?",
    )
    .get(type, id) as ResourcePolicy | undefined;
}

export function canUseResource(
  user: Principal,
  policy: ResourcePolicy | undefined,
) {
  if (!policy) return false;
  return (
    policy.ownerId === user.id ||
    policy.visibility === "all" ||
    (policy.visibility === "internal" &&
      hasPermission(user, "platform.internal"))
  );
}

export function canManageApplication(
  user: Principal,
  policy: ResourcePolicy | undefined,
) {
  if (!policy) return false;
  return (
    hasPermission(user, "applications.govern") ||
    (policy.ownerId === user.id && hasPermission(user, "appfactory.use")) ||
    (policy.visibility !== "private" &&
      hasPermission(user, "applications.manage"))
  );
}

export function writeResourcePolicy(
  type: string,
  id: string,
  ownerId: string,
  visibility: Visibility,
  expectedRevision?: number,
) {
  const db = getAgentHubDatabase();
  const existing = getResourcePolicy(type, id);
  if (
    expectedRevision !== undefined &&
    (existing?.revision ?? 0) !== expectedRevision
  )
    throw new AuthError("访问范围已被修改，请刷新后重试", 409);
  if (existing && existing.visibility !== visibility) {
    db.prepare(
      "UPDATE resource_policies SET visibility=?,revision=revision+1,updated_at=? WHERE resource_type=? AND resource_id=?",
    ).run(visibility, new Date().toISOString(), type, id);
  } else if (!existing) {
    db.prepare(
      "INSERT INTO resource_policies(resource_type,resource_id,owner_id,visibility,updated_at) VALUES (?,?,?,?,?)",
    ).run(type, id, ownerId, visibility, new Date().toISOString());
  }
}

export function audit(
  actorId: string,
  action: string,
  resourceId: string,
  detail: Record<string, unknown> = {},
) {
  getAgentHubDatabase()
    .prepare(
      "INSERT INTO platform_audit(id,actor_id,action,resource_id,detail_json,created_at) VALUES (?,?,?,?,?,?)",
    )
    .run(
      crypto.randomUUID(),
      actorId,
      action,
      resourceId,
      JSON.stringify(detail),
      new Date().toISOString(),
    );
}
