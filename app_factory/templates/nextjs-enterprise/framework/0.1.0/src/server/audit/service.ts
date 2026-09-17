import type { Principal } from "../auth/types.ts";
import { appTable, getDatabasePool, type SqlClient } from "../db/database.ts";

export type AuditInput = {
  actor?: Principal | null;
  action: string;
  entityType: string;
  entityId: string;
  outcome?: "success" | "failure";
  requestId?: string;
  details?: Record<string, unknown>;
  dedupeKey?: string;
};

export async function recordAudit(client: SqlClient, input: AuditInput) {
  await client.query(
    `INSERT INTO ${appTable("app_audit_events")}
      (id, actor_user_id, action, entity_type, entity_id, outcome, request_id, details_json, dedupe_key)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9)
     ON CONFLICT (dedupe_key) DO NOTHING`,
    [
      crypto.randomUUID(),
      input.actor?.userId || null,
      input.action,
      input.entityType,
      input.entityId,
      input.outcome || "success",
      input.requestId || null,
      JSON.stringify(input.details || {}),
      input.dedupeKey || null,
    ],
  );
}

export async function appendAudit(input: AuditInput) {
  await recordAudit(getDatabasePool(), input);
}

export async function listAuditEvents(limit = 100) {
  const result = await getDatabasePool().query<{
    id: string;
    actorUserId: string | null;
    action: string;
    entityType: string;
    entityId: string;
    outcome: string;
    requestId: string | null;
    createdAt: string;
  }>(
    `SELECT id, actor_user_id AS "actorUserId", action, entity_type AS "entityType",
            entity_id AS "entityId", outcome, request_id AS "requestId", created_at AS "createdAt"
       FROM ${appTable("app_audit_events")}
      ORDER BY created_at DESC
      LIMIT $1`,
    [Math.max(1, Math.min(limit, 200))],
  );
  return result.rows;
}
