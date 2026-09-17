import { badRequest, notFound } from "../errors/app-error.ts";
import { appTable, getDatabasePool, transaction, type SqlClient } from "../db/database.ts";

export type Department = {
  id: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
};

type DepartmentRow = {
  id: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
};

function present(row: DepartmentRow): Department {
  return {
    id: row.id,
    name: row.name,
    parentId: row.parent_id,
    sortOrder: row.sort_order,
  };
}

export async function ensureRootDepartment(client: SqlClient) {
  const existing = await client.query<DepartmentRow>(
    `SELECT id, name, parent_id, sort_order FROM ${appTable("app_departments")}
      WHERE parent_id IS NULL ORDER BY created_at LIMIT 1`,
  );
  if (existing.rows[0]) return present(existing.rows[0]);
  const created = await client.query<DepartmentRow>(
    `INSERT INTO ${appTable("app_departments")} (id, name, parent_id, sort_order)
     VALUES ($1, $2, NULL, 0)
     RETURNING id, name, parent_id, sort_order`,
    [crypto.randomUUID(), "公司本部"],
  );
  return present(created.rows[0]!);
}

export async function listDepartments() {
  const result = await getDatabasePool().query<DepartmentRow>(
    `SELECT id, name, parent_id, sort_order FROM ${appTable("app_departments")}
     ORDER BY sort_order, name`,
  );
  return result.rows.map(present);
}

export async function getDepartment(id: string) {
  const result = await getDatabasePool().query<DepartmentRow>(
    `SELECT id, name, parent_id, sort_order FROM ${appTable("app_departments")} WHERE id=$1`,
    [id],
  );
  return result.rows[0] ? present(result.rows[0]) : null;
}

export async function assertDepartmentExists(id: string | null, client: SqlClient = getDatabasePool()) {
  if (!id) return null;
  const result = await client.query<{ id: string }>(
    `SELECT id FROM ${appTable("app_departments")} WHERE id=$1`,
    [id],
  );
  if (!result.rows[0]) throw notFound("部门不存在");
  return id;
}

export async function createDepartment(input: { name: string; parentId?: string | null; sortOrder?: number }) {
  const name = input.name.trim();
  if (!name || name.length > 120) throw badRequest("部门名称长度必须在 1 到 120 个字符之间");
  return transaction(async (client) => {
    await assertDepartmentExists(input.parentId || null, client);
    const result = await client.query<DepartmentRow>(
      `INSERT INTO ${appTable("app_departments")} (id, name, parent_id, sort_order)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, parent_id, sort_order`,
      [crypto.randomUUID(), name, input.parentId || null, input.sortOrder || 0],
    );
    return present(result.rows[0]!);
  });
}

export async function getDepartmentAndChildrenIds(departmentId: string) {
  const result = await getDatabasePool().query<{ id: string }>(
    `WITH RECURSIVE department_tree AS (
       SELECT id FROM ${appTable("app_departments")} WHERE id=$1
       UNION ALL
       SELECT child.id FROM ${appTable("app_departments")} child
       JOIN department_tree parent ON child.parent_id=parent.id
     ) SELECT id FROM department_tree`,
    [departmentId],
  );
  return result.rows.map((row) => row.id);
}
