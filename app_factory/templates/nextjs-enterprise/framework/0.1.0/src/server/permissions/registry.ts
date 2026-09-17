import { badRequest } from "../errors/app-error.ts";
import { appTable, getDatabasePool, type SqlClient } from "../db/database.ts";
import type { PermissionDefinition } from "./types.ts";

function assertPermissionDefinition(definition: PermissionDefinition) {
  if (!/^[a-z][a-z0-9]*(?:\.[a-z][a-z0-9_]*){1,5}$/.test(definition.code)) {
    throw badRequest(`权限编码无效：${definition.code}`);
  }
  if (!definition.name.trim() || definition.name.length > 120) {
    throw badRequest(`权限名称无效：${definition.code}`);
  }
}

export async function syncPermissionDefinitions(
  definitions: readonly PermissionDefinition[],
  client: SqlClient = getDatabasePool(),
) {
  const codes = new Set<string>();
  for (const definition of definitions) {
    assertPermissionDefinition(definition);
    if (codes.has(definition.code)) throw badRequest(`权限编码重复：${definition.code}`);
    codes.add(definition.code);
    await client.query(
      `INSERT INTO ${appTable("app_permissions")} (code, name, description)
       VALUES ($1, $2, $3)
       ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description`,
      [definition.code, definition.name.trim(), definition.description?.trim() || null],
    );
  }
}

export async function listPermissionDefinitions() {
  const result = await getDatabasePool().query<PermissionDefinition>(
    `SELECT code, name, description FROM ${appTable("app_permissions")} ORDER BY code`,
  );
  return result.rows;
}
