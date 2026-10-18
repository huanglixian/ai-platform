import { z } from "zod";
import { currentUser, requireRequestUser } from "@/features/auth/context";
import { AuthError } from "@/features/auth/errors";
import { hasPermission } from "@/features/auth/types";
import { audit, canManageApplication, canUseResource, getResourcePolicy, writeResourcePolicy } from "@/features/access/server";
import type { Visibility } from "@/features/access/types";
import { stopPublishedApplication } from "@/app_factory/server/publication/runtime";
import { hasActivePublicationForProject } from "@/app_factory/server/publication/repository";
import { getAgentHubDatabase } from "@/lib/agenthub/database";
import { EXTERNAL_APP_SEEDS } from "./external-app-seed";
import { isProcessGroupRunning, isUrlReady, startExternalProcess, stopExternalProcess } from "./external-launcher";
import { INITIAL_APPS } from "./mock-data";
import type { ExternalLaunchStatus, ExternalStopResult, PlatformSource, PublishedApp } from "./types";

const platformSources = ["appfactory", "external", "dify", "n8n"] as const;
const platformSourceSchema = z.enum(platformSources);
const visibilitySchema = z.enum(["private", "internal", "all"]);
const webUrlSchema = z.string().trim().url().refine((value) => ["http:", "https:"].includes(new URL(value).protocol), "应用地址必须使用 HTTP 或 HTTPS");

export const applicationInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).default(""),
  producer: platformSourceSchema,
  kind: z.string().trim().min(1).max(40).default("application"),
  runtime: z.string().trim().min(1).max(40).default("web"),
  status: z.enum(["active", "archived", "disabled"]).default("active"),
  entryUrl: webUrlSchema,
  visibility: visibilitySchema.default("internal"),
  version: z.string().trim().max(40).default("1.0.0"),
  externalId: z.string().trim().max(120).optional(),
  launchCommand: z.string().trim().min(1).max(5_000).optional(),
}).strict().superRefine((input, context) => {
  if (input.producer === "external" && !input.launchCommand) {
    context.addIssue({ code: "custom", path: ["launchCommand"], message: "外部应用必须提供启动命令" });
  }
  if (input.producer !== "external" && input.launchCommand) {
    context.addIssue({ code: "custom", path: ["launchCommand"], message: "只有外部应用可以设置启动命令" });
  }
});

const applicationMetadataUpdateFields = {
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(2_000).optional(),
  visibility: visibilitySchema.optional(),
  policyRevision: z.number().int().positive().optional(),
};

export const appFactoryApplicationUpdateSchema = z.object(applicationMetadataUpdateFields).strict();

export const applicationUpdateSchema = z.object({
  ...applicationMetadataUpdateFields,
  entryUrl: webUrlSchema.optional(),
}).strict();

export const externalApplicationUpdateSchema = applicationUpdateSchema.extend({
  launchCommand: z.string().trim().min(1).max(5_000).optional(),
}).strict();

type ApplicationInput = z.infer<typeof applicationInputSchema>;

function getLaunchPid(row: Record<string, unknown>) {
  return typeof row.launch_pid === "number" ? row.launch_pid : null;
}

function getLaunchStatus(source: PlatformSource, row: Record<string, unknown>): ExternalLaunchStatus {
  const pid = getLaunchPid(row);
  if (source !== "external" || pid === null || !isProcessGroupRunning(pid)) return null;
  return row.launch_status === "starting" || row.launch_status === "running"
    ? row.launch_status
    : null;
}

function rowToApp(row: Record<string, unknown>): PublishedApp {
  const source = platformSourceSchema.parse(row.producer) as PlatformSource;
  const user = currentUser();
  const policy = getResourcePolicy("application", String(row.id));
  const canOperate = Boolean(user && hasPermission(user, "applications.manage") && canManageApplication(user, policy));
  const canManage = Boolean(user && canManageApplication(user, policy) && (source === "appfactory" || canOperate));
  return {
    id: String(row.id),
    name: String(row.name),
    description: String(row.description ?? ""),
    source,
    appType: row.kind === "business" ? "business" : "general",
    url: !user || canManage ? String(row.entry_url) : `/applications/${encodeURIComponent(String(row.id))}/open`,
    launchCommand: (!user || canOperate) && typeof row.launch_command === "string" ? row.launch_command : null,
    launchStatus: getLaunchStatus(source, row),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    ...(user ? { canManage, canOperate, canUse: canUseResource(user, policy), ...(canManage ? { access: policy } : {}) } : {}),
  };
}

function getApplicationRow(id: string) {
  return getAgentHubDatabase().prepare("SELECT * FROM applications WHERE id = ?").get(id) as Record<string, unknown> | undefined;
}

function getExternalApplicationRow(id: string) {
  const row = getApplicationRow(id);
  if (!row || row.producer !== "external") return null;
  return row;
}

function updateLaunchState(
  id: string,
  pid: number | null,
  startedAt: string | null,
  status: ExternalLaunchStatus,
  expectedPid?: number,
) {
  const database = getAgentHubDatabase();
  const now = new Date().toISOString();
  const result = expectedPid === undefined
    ? database.prepare("UPDATE applications SET launch_pid=?, launch_started_at=?, launch_status=?, updated_at=? WHERE id=?")
      .run(pid, startedAt, status, now, id)
    : database.prepare("UPDATE applications SET launch_pid=?, launch_started_at=?, launch_status=?, updated_at=? WHERE id=? AND launch_pid=?")
      .run(pid, startedAt, status, now, id, expectedPid);
  return result.changes > 0;
}

export function seedApplications() {
  const db = getAgentHubDatabase();
  if (db.prepare("SELECT 1 FROM application_seed_state WHERE id=1").get()) return;
  const insertMock = db.prepare(`INSERT OR IGNORE INTO applications
    (id,name,description,producer,kind,runtime,status,entry_url,version,created_at,updated_at)
    VALUES (@id,@name,@description,@producer,@kind,'web','active',@entryUrl,'1.0.0',@createdAt,@updatedAt)`);
  const insertExternal = db.prepare(`INSERT OR IGNORE INTO applications
    (id,name,description,producer,kind,runtime,status,entry_url,version,external_id,launch_command,created_at,updated_at)
    VALUES (@id,@name,@description,'external',@kind,'web','active',@entryUrl,'1.0.0',@externalId,@launchCommand,@createdAt,@updatedAt)`);
  const seed = db.transaction(() => {
    for (const app of INITIAL_APPS) {
      insertMock.run({
        id: app.id,
        name: app.name,
        description: app.description,
        producer: app.source,
        kind: app.appType,
        entryUrl: app.url,
        createdAt: app.createdAt,
        updatedAt: app.updatedAt,
      });
    }
    const now = new Date().toISOString();
    for (const app of EXTERNAL_APP_SEEDS) {
      insertExternal.run({
        ...app,
        kind: app.appType,
        entryUrl: app.url,
        createdAt: now,
        updatedAt: now,
      });
    }
    db.prepare("INSERT INTO application_seed_state(id,seeded_at) VALUES (1,?)").run(now);
    const owner = db.prepare("SELECT user_id FROM platform_user_roles WHERE role_code='super_admin' LIMIT 1").get() as { user_id: string } | undefined;
    if (owner) {
      db.prepare("INSERT OR IGNORE INTO resource_policies(resource_type,resource_id,owner_id,visibility,updated_at) SELECT 'application',id,?,'internal',? FROM applications").run(owner.user_id, now);
    }
  });
  seed();
}

export function listApplications() {
  const user = requireRequestUser();
  seedApplications();
  const rows = getAgentHubDatabase().prepare(`SELECT * FROM applications
    WHERE status != 'archived' AND producer IN ('appfactory', 'external', 'dify', 'n8n')
    ORDER BY CASE producer
      WHEN 'appfactory' THEN 0
      WHEN 'external' THEN 1
      WHEN 'dify' THEN 2
      WHEN 'n8n' THEN 3
    END, CASE
      WHEN producer != 'external' THEN 0
      WHEN id = 'app-external-customer-management' THEN 0
      WHEN id = 'app-external-qiaoyin-crm' THEN 1
      WHEN id = 'app-external-dagefan-ltc' THEN 2
      WHEN name IN ('AI招投标', 'AI招投标管理') THEN 3
      WHEN id = 'app-external-zhongda-service' THEN 4
      WHEN id = 'app-external-power-engineering' THEN 5
      WHEN id = 'app-external-tower-match' THEN 6
      WHEN id = 'app-external-data-resource' THEN 7
      WHEN id = 'app-external-data-preprocessing' THEN 8
      WHEN id = 'app-external-document-chunking' THEN 9
      WHEN id = 'app-external-document-knowledge' THEN 10
      WHEN id = 'app-external-data-extraction' THEN 11
      WHEN id = 'app-external-investment-reference' THEN 12
      WHEN id = 'app-external-document-review' THEN 13
      ELSE 14
    END, created_at DESC`).all() as Record<string, unknown>[];
  return rows.filter((row) => canUseResource(user, getResourcePolicy("application", String(row.id)))).map(rowToApp);
}

export function createApplication(input: ApplicationInput, options?: { ownerId: string; expectedRevision: number; actorId: string }) {
  const db = getAgentHubDatabase();
  const user = currentUser();
  const ownerId = options?.ownerId ?? requireRequestUser().id;
  return db.transaction(() => {
    if (input.externalId) {
      const existing = db.prepare("SELECT id FROM applications WHERE producer=? AND external_id=?").get(input.producer, input.externalId) as { id: string } | undefined;
      if (existing) {
        if (user && !canManageApplication(user, getResourcePolicy("application", existing.id))) throw new AuthError("无权更新该应用");
        return updateApplication(existing.id, { ...input, policyRevision: options?.expectedRevision }, options?.actorId);
      }
    }
    if (options && options.expectedRevision !== 0) throw new AuthError("应用注册已变化，请重新发布", 409);
    const now = new Date().toISOString();
    const id = `app-${crypto.randomUUID()}`;
    getAgentHubDatabase().prepare(`INSERT INTO applications
      (id,name,description,producer,kind,runtime,status,entry_url,version,external_id,launch_command,created_at,updated_at,created_by,updated_by)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      id, input.name, input.description, input.producer, input.kind, input.runtime, input.status,
      input.entryUrl, input.version, input.externalId ?? null, input.launchCommand ?? null, now, now, options?.actorId ?? ownerId, options?.actorId ?? ownerId,
    );
    writeResourcePolicy("application", id, ownerId, input.visibility);
    audit(options?.actorId ?? ownerId, "application.create", id, { visibility: input.visibility });
    return rowToApp(getApplicationRow(id)!);
  })();
}

export function getApplication(id: string) {
  const user = requireRequestUser();
  seedApplications();
  const row = getApplicationRow(id);
  return row && (canUseResource(user, getResourcePolicy("application", id)) || hasPermission(user, "applications.govern")) ? rowToApp(row) : null;
}

export function updateApplication(id: string, input: Partial<ApplicationInput> & { policyRevision?: number }, actorId = currentUser()?.id ?? "system") {
  const db = getAgentHubDatabase();
  return db.transaction(() => {
    const current = getApplicationRow(id);
    if (!current) return null;
    const next = {
      name: String(current.name),
      description: String(current.description ?? ""),
      producer: platformSourceSchema.parse(current.producer),
      kind: String(current.kind),
      runtime: String(current.runtime),
      status: String(current.status),
      entryUrl: String(current.entry_url),
      version: String(current.version ?? "1.0.0"),
      externalId: current.external_id ? String(current.external_id) : undefined,
      launchCommand: current.launch_command ? String(current.launch_command) : undefined,
      ...input,
    };
    if (input.visibility !== undefined) {
      const policy = getResourcePolicy("application", id);
      if (!policy) throw new AuthError("应用缺少访问策略", 409);
      writeResourcePolicy("application", id, policy.ownerId, input.visibility, input.policyRevision);
      if (policy.visibility !== input.visibility) audit(actorId, "application.access", id, { visibility: input.visibility });
    }
    getAgentHubDatabase().prepare(`UPDATE applications
      SET name=?,description=?,producer=?,kind=?,runtime=?,status=?,entry_url=?,version=?,external_id=?,launch_command=?,updated_at=?,updated_by=?
      WHERE id=?`).run(
      next.name, next.description, next.producer, next.kind, next.runtime, next.status,
      next.entryUrl, next.version, next.externalId ?? null, next.launchCommand ?? null,
      new Date().toISOString(), actorId, id,
    );
    audit(actorId, "application.update", id);
    return rowToApp(getApplicationRow(id)!);
  })();
}

export async function startExternalApplication(id: string) {
  seedApplications();
  let current = getExternalApplicationRow(id);
  if (!current) return null;
  const currentPid = getLaunchPid(current);
  if (currentPid !== null && !isProcessGroupRunning(currentPid)) {
    updateLaunchState(id, null, null, null, currentPid);
    current = getExternalApplicationRow(id);
    if (!current) return null;
  }

  const url = String(current.entry_url);
  if (await isUrlReady(url)) {
    const managedPid = getLaunchPid(current);
    if (managedPid !== null && isProcessGroupRunning(managedPid)) {
      updateLaunchState(id, managedPid, String(current.launch_started_at ?? new Date().toISOString()), "running", managedPid);
    }
    return getApplication(id);
  }

  const managedPid = getLaunchPid(current);
  if (managedPid !== null && isProcessGroupRunning(managedPid)) {
    throw new Error("服务正在启动或尚未就绪，请先停止当前服务后再试。");
  }

  const launchCommand = typeof current.launch_command === "string" ? current.launch_command : "";
  if (!launchCommand) throw new Error("该外部应用没有启动命令。");

  let spawnedPid: number | null = null;
  try {
    const launched = await startExternalProcess({
      command: launchCommand,
      url,
      onSpawn: async (pid) => {
        spawnedPid = pid;
        updateLaunchState(id, pid, new Date().toISOString(), "starting");
      },
    });
    if (launched.pid !== null) {
      updateLaunchState(id, launched.pid, new Date().toISOString(), "running", launched.pid);
    }
    return getApplication(id);
  } catch (error) {
    if (spawnedPid !== null) {
      try {
        await stopExternalProcess(spawnedPid);
      } finally {
        updateLaunchState(id, null, null, null, spawnedPid);
      }
    }
    throw error;
  }
}

export async function stopExternalApplication(id: string) {
  const current = getExternalApplicationRow(id);
  if (!current) return null;
  const pid = getLaunchPid(current);
  if (pid === null) throw new Error("该服务并非由应用中心启动，无法在这里停止。");
  await stopExternalProcess(pid);
  updateLaunchState(id, null, null, null, pid);
  return getApplication(id);
}

export async function removeApplication(id: string) {
  const current = getApplicationRow(id);
  if (!current) return false;
  const source = platformSourceSchema.parse(current.producer) as PlatformSource;
  if (source === "external") {
    const pid = getLaunchPid(current);
    if (pid !== null) await stopExternalProcess(pid);
  } else if (source === "appfactory") {
    const projectId = typeof current.external_id === "string" ? current.external_id : "";
    if (!projectId) throw new Error("AppFactory 应用缺少关联项目，无法移除。");
    if (hasActivePublicationForProject(projectId)) {
      throw new Error("应用正在发布，发布完成后才能移除。");
    }
    await stopPublishedApplication(projectId);
  }
  const db = getAgentHubDatabase();
  return db.transaction(() => {
    db.prepare("DELETE FROM resource_policies WHERE resource_type='application' AND resource_id=?").run(id);
    const result = db.prepare("DELETE FROM applications WHERE id=?").run(id);
    audit(currentUser()?.id ?? "system", "application.delete", id);
    return result.changes > 0;
  })();
}

export async function stopManagedExternalApplications(): Promise<ExternalStopResult> {
  const rows = getAgentHubDatabase().prepare(
    "SELECT id, name, launch_pid FROM applications WHERE producer='external' AND launch_pid IS NOT NULL",
  ).all() as { id: string; name: string; launch_pid: number }[];
  const user = currentUser();
  const managedRows = rows.filter((row) => !user || canManageApplication(user, getResourcePolicy("application", row.id)));
  const results = await Promise.allSettled(managedRows.map(async (row) => {
    await stopExternalProcess(row.launch_pid);
    updateLaunchState(row.id, null, null, null, row.launch_pid);
  }));
  const result: ExternalStopResult = { stoppedIds: [], failures: [] };
  results.forEach((entry, index) => {
    const row = managedRows[index];
    if (entry.status === "fulfilled") result.stoppedIds.push(row.id);
    else result.failures.push({
      id: row.id,
      name: row.name,
      message: entry.reason instanceof Error ? entry.reason.message : "停止服务失败",
    });
  });
  return result;
}

export function publishedApplicationAccess(projectId: string) {
  const row = getAgentHubDatabase().prepare("SELECT id FROM applications WHERE producer='appfactory' AND external_id=?").get(projectId) as { id: string } | undefined;
  return row ? getResourcePolicy("application", row.id) : undefined;
}

export function applicationEntry(id: string) {
  const row = getApplicationRow(id);
  return row ? { url: String(row.entry_url), status: String(row.status), source: String(row.producer), launchStatus: getLaunchStatus(platformSourceSchema.parse(row.producer), row) } : null;
}
