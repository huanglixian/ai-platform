import { createHash } from "node:crypto";

import { conflict, badRequest } from "../errors/app-error.ts";
import { appTable, type SqlClient } from "./database.ts";

type IdempotencyInput = {
  actorUserId: string;
  operation: string;
  key: string;
  request: unknown;
};

function hash(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export async function executeIdempotently<T extends Record<string, unknown>>(
  client: SqlClient,
  input: IdempotencyInput,
  work: () => Promise<T>,
) {
  if (!input.key || input.key.length > 160) throw badRequest("幂等键长度必须在 1 到 160 个字符之间");
  if (!/^[a-z][a-z0-9._-]{2,120}$/.test(input.operation)) {
    throw badRequest("幂等操作标识无效");
  }
  const requestHash = hash(input.request);
  await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
    `idempotency:${input.actorUserId}:${input.operation}:${input.key}`,
  ]);
  const existing = await client.query<{ request_hash: string; response_json: T | null }>(
    `SELECT request_hash, response_json FROM ${appTable("app_idempotency_keys")}
      WHERE actor_user_id=$1 AND operation=$2 AND key=$3`,
    [input.actorUserId, input.operation, input.key],
  );
  if (existing.rows[0]) {
    if (existing.rows[0].request_hash !== requestHash) {
      throw conflict("同一幂等键不能用于不同请求");
    }
    if (!existing.rows[0].response_json) throw conflict("幂等请求正在处理中");
    return { value: existing.rows[0].response_json, reused: true };
  }
  const value = await work();
  await client.query(
    `INSERT INTO ${appTable("app_idempotency_keys")}
      (actor_user_id, operation, key, request_hash, response_json)
     VALUES ($1, $2, $3, $4, $5::jsonb)`,
    [input.actorUserId, input.operation, input.key, requestHash, JSON.stringify(value)],
  );
  return { value, reused: false };
}
