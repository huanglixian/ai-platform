import type { SqlClient } from "../db/database.ts";
import { appTable, getDatabasePool } from "../db/database.ts";

export type NotificationInput = {
  recipientUserId: string;
  subject: string;
  body: string;
  link?: string | null;
  dedupeKey?: string;
};

export async function sendNotification(client: SqlClient, input: NotificationInput) {
  await client.query(
    `INSERT INTO ${appTable("app_notifications")}
      (id, recipient_user_id, subject, body, link, dedupe_key)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (dedupe_key) DO NOTHING`,
    [
      crypto.randomUUID(),
      input.recipientUserId,
      input.subject,
      input.body,
      input.link || null,
      input.dedupeKey || null,
    ],
  );
}

export async function listNotifications(userId: string, limit = 100) {
  const result = await getDatabasePool().query(
    `SELECT id, subject, body, link, read_at AS "readAt", created_at AS "createdAt"
       FROM ${appTable("app_notifications")}
      WHERE recipient_user_id=$1
      ORDER BY created_at DESC
      LIMIT $2`,
    [userId, Math.max(1, Math.min(limit, 200))],
  );
  return result.rows;
}

export async function markNotificationRead(userId: string, notificationId: string) {
  await getDatabasePool().query(
    `UPDATE ${appTable("app_notifications")} SET read_at=COALESCE(read_at, NOW())
      WHERE id=$1 AND recipient_user_id=$2`,
    [notificationId, userId],
  );
}
