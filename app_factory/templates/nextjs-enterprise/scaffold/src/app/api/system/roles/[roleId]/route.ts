import { appendAudit } from "@/server/audit/service";
import { requirePrincipal } from "@/server/auth/session";
import { badRequest } from "@/server/errors/app-error";
import { errorResponse } from "@/server/errors/response";
import { requestIdFor } from "@/server/observability/logger";
import { requirePermission, updateRole, type RoleGrant } from "@/server/permissions/service";
import { isDataScope } from "@/server/permissions/types";
import { readJson, record, optionalStringField, stringField } from "@/server/validation/input";

export const runtime = "nodejs";

function readGrants(value: unknown): RoleGrant[] {
  if (!Array.isArray(value) || value.length > 200) throw badRequest("grants 必须是至多 200 项的数组");
  return value.map((item) => {
    const grant = record(item);
    const dataScope = stringField(grant.dataScope, "dataScope", { max: 40 });
    if (!isDataScope(dataScope)) throw badRequest("dataScope 无效");
    return {
      permissionCode: stringField(grant.permissionCode, "permissionCode", { max: 160 }),
      dataScope,
    };
  });
}

export async function PATCH(request: Request, context: { params: Promise<{ roleId: string }> }) {
  const requestId = requestIdFor(request);
  try {
    const principal = await requirePrincipal(request);
    await requirePermission(principal, "system.roles.manage");
    const body = record(await readJson(request));
    const { roleId } = await context.params;
    const role = await updateRole(roleId, {
      name: stringField(body.name, "name", { min: 1, max: 120 }),
      description: optionalStringField(body.description, "description", { max: 500 }),
      grants: readGrants(body.grants),
    });
    await appendAudit({
      actor: principal,
      action: "system.role.updated",
      entityType: "role",
      entityId: roleId,
      requestId,
    });
    return Response.json({ data: role, requestId });
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
