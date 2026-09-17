import type { QueryResultRow } from "pg";

import { getWorkerConfig } from "../env/runtime-config.ts";
import { appTable, getDatabasePool, transaction, type SqlClient } from "../db/database.ts";

export type AppJob = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  actorUserId: string | null;
  requestId: string | null;
  idempotencyKey: string;
  status: "queued" | "running" | "succeeded" | "failed";
  attempts: number;
  maxAttempts: number;
  lockedBy: string | null;
};

type JobRow = QueryResultRow & {
  id: string;
  type: string;
  payload_json: Record<string, unknown>;
  actor_user_id: string | null;
  request_id: string | null;
  idempotency_key: string;
  status: AppJob["status"];
  attempts: number;
  max_attempts: number;
  locked_by: string | null;
};

function presentJob(row: JobRow): AppJob {
  return {
    id: row.id,
    type: row.type,
    payload: row.payload_json || {},
    actorUserId: row.actor_user_id,
    requestId: row.request_id,
    idempotencyKey: row.idempotency_key,
    status: row.status,
    attempts: row.attempts,
    maxAttempts: row.max_attempts,
    lockedBy: row.locked_by,
  };
}

function limitFor(type: string, concurrencyByType: Record<string, number>) {
  const configured = concurrencyByType[type] || 1;
  return Math.max(1, Math.min(configured, 32));
}

export async function enqueueJob(
  input: {
    type: string;
    payload: Record<string, unknown>;
    actorUserId?: string | null;
    requestId?: string | null;
    idempotencyKey: string;
    maxAttempts?: number;
  },
  client: SqlClient = getDatabasePool(),
) {
  if (!/^[a-z][a-z0-9._-]{2,120}$/.test(input.type)) {
    throw new Error("Job type 不合法");
  }
  const result = await client.query<JobRow>(
    `INSERT INTO ${appTable("app_jobs")}
      (id, type, payload_json, actor_user_id, request_id, idempotency_key, status, max_attempts)
     VALUES ($1, $2, $3::jsonb, $4, $5, $6, 'queued', $7)
     ON CONFLICT (idempotency_key) DO UPDATE SET updated_at=NOW()
     RETURNING id, type, payload_json, actor_user_id, request_id, idempotency_key,
               status, attempts, max_attempts, locked_by`,
    [
      crypto.randomUUID(),
      input.type,
      JSON.stringify(input.payload),
      input.actorUserId || null,
      input.requestId || null,
      input.idempotencyKey,
      Math.max(1, Math.min(input.maxAttempts || 3, 10)),
    ],
  );
  return presentJob(result.rows[0]!);
}

async function recoverStaleJobs() {
  const lockTimeout = getWorkerConfig().lockTimeoutSeconds;
  await getDatabasePool().query(
    `UPDATE ${appTable("app_jobs")}
        SET status=CASE WHEN attempts>=max_attempts THEN 'failed' ELSE 'queued' END,
            available_at=NOW(), locked_by=NULL, locked_at=NULL,
            last_error=COALESCE(last_error, 'Worker 锁已过期'), updated_at=NOW()
      WHERE status='running' AND locked_at < NOW() - ($1 * INTERVAL '1 second')`,
    [lockTimeout],
  );
}

export async function claimNextJob(workerId: string, concurrencyByType: Record<string, number>) {
  await recoverStaleJobs();
  return transaction(async (client) => {
    const types = await client.query<{ type: string }>(
      `SELECT DISTINCT type FROM ${appTable("app_jobs")}
        WHERE status='queued' AND available_at<=NOW() ORDER BY type`,
    );
    for (const candidate of types.rows) {
      const lock = await client.query<{ acquired: boolean }>(
        "SELECT pg_try_advisory_xact_lock(hashtext($1)) AS acquired",
        [`app-job-type:${candidate.type}`],
      );
      if (!lock.rows[0]?.acquired) continue;
      const active = await client.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM ${appTable("app_jobs")}
          WHERE type=$1 AND status='running'`,
        [candidate.type],
      );
      if (Number(active.rows[0]?.count || 0) >= limitFor(candidate.type, concurrencyByType)) continue;
      const next = await client.query<JobRow>(
        `SELECT id, type, payload_json, actor_user_id, request_id, idempotency_key,
                status, attempts, max_attempts, locked_by
           FROM ${appTable("app_jobs")}
          WHERE type=$1 AND status='queued' AND available_at<=NOW()
          ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1`,
        [candidate.type],
      );
      if (!next.rows[0]) continue;
      const claimed = await client.query<JobRow>(
        `UPDATE ${appTable("app_jobs")}
            SET status='running', attempts=attempts+1, locked_by=$2, locked_at=NOW(), updated_at=NOW()
          WHERE id=$1
          RETURNING id, type, payload_json, actor_user_id, request_id, idempotency_key,
                    status, attempts, max_attempts, locked_by`,
        [next.rows[0].id, workerId],
      );
      return presentJob(claimed.rows[0]!);
    }
    return null;
  });
}

export async function heartbeatJob(job: AppJob) {
  const result = await getDatabasePool().query(
    `UPDATE ${appTable("app_jobs")} SET locked_at=NOW(), updated_at=NOW()
      WHERE id=$1 AND status='running' AND locked_by=$2`,
    [job.id, job.lockedBy],
  );
  return result.rowCount === 1;
}

export async function completeJob(job: AppJob, result: Record<string, unknown> = {}) {
  await getDatabasePool().query(
    `UPDATE ${appTable("app_jobs")}
        SET status='succeeded', result_json=$3::jsonb, locked_by=NULL, locked_at=NULL, updated_at=NOW()
      WHERE id=$1 AND status='running' AND locked_by=$2`,
    [job.id, job.lockedBy, JSON.stringify(result)],
  );
}

export async function failJob(
  job: AppJob,
  error: unknown,
  retryBaseMilliseconds = getWorkerConfig().retryBaseMilliseconds,
) {
  const message = error instanceof Error ? error.message : String(error);
  await getDatabasePool().query(
    `UPDATE ${appTable("app_jobs")}
        SET status=CASE WHEN attempts>=max_attempts THEN 'failed' ELSE 'queued' END,
            available_at=CASE WHEN attempts>=max_attempts THEN NOW()
              ELSE NOW() + ($3 * (2 ^ GREATEST(attempts - 1, 0)) * INTERVAL '1 millisecond') END,
            locked_by=NULL, locked_at=NULL, last_error=$4, updated_at=NOW()
      WHERE id=$1 AND status='running' AND locked_by=$2`,
    [job.id, job.lockedBy, retryBaseMilliseconds, message.slice(0, 1_000)],
  );
}
