import { z } from "zod";
import { getAgentHubDatabase } from "@/lib/agenthub/database";
import { EXTERNAL_APP_SEEDS } from "./external-app-seed";
import { isProcessGroupRunning, isUrlReady, startExternalProcess, stopExternalProcess } from "./external-launcher";
import { INITIAL_APPS } from "./mock-data";
import type { PlatformSource, PublishedApp } from "./types";

const platformSources = ["appfactory", "external", "dify", "n8n"] as const;
const platformSourceSchema = z.enum(platformSources);

export const applicationInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).default(""),
  producer: platformSourceSchema,
  kind: z.string().trim().min(1).max(40).default("application"),
  runtime: z.string().trim().min(1).max(40).default("web"),
  status: z.enum(["active", "archived", "disabled"]).default("active"),
  entryUrl: z.string().trim().url(),
  version: z.string().trim().max(40).default("1.0.0"),
  externalId: z.string().trim().max(120).optional(),
  launchCommand: z.string().trim().min(1).max(5_000).optional(),
}).superRefine((input, context) => {
  if (input.producer === "external" && !input.launchCommand) {
    context.addIssue({ code: "custom", path: ["launchCommand"], message: "外部应用必须提供启动命令" });
  }
  if (input.producer !== "external" && input.launchCommand) {
    context.addIssue({ code: "custom", path: ["launchCommand"], message: "只有外部应用可以设置启动命令" });
  }
});

export const externalApplicationInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(2_000),
  kind: z.enum(["business", "general"]).default("business"),
  entryUrl: z.string().trim().url(),
  launchCommand: z.string().trim().min(1).max(5_000),
});

export const externalApplicationUpdateSchema = externalApplicationInputSchema.partial();

type ApplicationInput = z.infer<typeof applicationInputSchema>;
type ExternalApplicationInput = z.infer<typeof externalApplicationInputSchema>;

function rowToApp(row: Record<string, unknown>): PublishedApp {
  const source = platformSourceSchema.parse(row.producer) as PlatformSource;
  const launchPid = typeof row.launch_pid === "number" ? row.launch_pid : null;
  return {
    id: String(row.id),
    name: String(row.name),
    description: String(row.description ?? ""),
    source,
    appType: row.kind === "business" ? "business" : "general",
    url: String(row.entry_url),
    launchCommand: typeof row.launch_command === "string" ? row.launch_command : null,
    launchPid,
    launchStartedAt: typeof row.launch_started_at === "string" ? row.launch_started_at : null,
    isManagedRunning: source === "external" && launchPid !== null && isProcessGroupRunning(launchPid),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
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

function updateLaunchState(id: string, pid: number | null, startedAt: string | null) {
  getAgentHubDatabase().prepare(
    "UPDATE applications SET launch_pid=?, launch_started_at=?, updated_at=? WHERE id=?",
  ).run(pid, startedAt, new Date().toISOString(), id);
}

export function seedApplications() {
  const db = getAgentHubDatabase();
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
  });
  seed();
}

export function listApplications() {
  seedApplications();
  const rows = getAgentHubDatabase().prepare(`SELECT * FROM applications
    WHERE status != 'archived' AND producer IN ('appfactory', 'external', 'dify', 'n8n')
    ORDER BY CASE producer
      WHEN 'appfactory' THEN 0
      WHEN 'external' THEN 1
      WHEN 'dify' THEN 2
      WHEN 'n8n' THEN 3
    END, created_at DESC`).all() as Record<string, unknown>[];
  return rows.map(rowToApp);
}

export function createApplication(input: ApplicationInput) {
  if (input.externalId) {
    const existing = getAgentHubDatabase().prepare("SELECT id FROM applications WHERE external_id = ?").get(input.externalId) as { id: string } | undefined;
    if (existing) return updateApplication(existing.id, input);
  }
  const now = new Date().toISOString();
  const id = `app-${crypto.randomUUID()}`;
  getAgentHubDatabase().prepare(`INSERT INTO applications
    (id,name,description,producer,kind,runtime,status,entry_url,version,external_id,launch_command,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    id, input.name, input.description, input.producer, input.kind, input.runtime, input.status,
    input.entryUrl, input.version, input.externalId ?? null, input.launchCommand ?? null, now, now,
  );
  return getApplication(id);
}

export function getApplication(id: string) {
  seedApplications();
  const row = getApplicationRow(id);
  return row ? rowToApp(row) : null;
}

function updateApplication(id: string, input: Partial<ApplicationInput>) {
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
  getAgentHubDatabase().prepare(`UPDATE applications
    SET name=?,description=?,producer=?,kind=?,runtime=?,status=?,entry_url=?,version=?,external_id=?,launch_command=?,updated_at=?
    WHERE id=?`).run(
    next.name, next.description, next.producer, next.kind, next.runtime, next.status,
    next.entryUrl, next.version, next.externalId ?? null, next.launchCommand ?? null,
    new Date().toISOString(), id,
  );
  return getApplication(id);
}

export function updateExternalApplication(id: string, input: Partial<ExternalApplicationInput>) {
  const current = getExternalApplicationRow(id);
  if (!current) return null;
  return updateApplication(id, {
    ...input,
    producer: "external",
    runtime: "web",
    status: "active",
  });
}

export async function startExternalApplication(id: string) {
  seedApplications();
  let current = getExternalApplicationRow(id);
  if (!current) return null;
  const currentPid = typeof current.launch_pid === "number" ? current.launch_pid : null;
  if (currentPid !== null && !isProcessGroupRunning(currentPid)) {
    updateLaunchState(id, null, null);
    current = getExternalApplicationRow(id);
    if (!current) return null;
  }

  const url = String(current.entry_url);
  if (await isUrlReady(url)) return getApplication(id);

  const managedPid = typeof current.launch_pid === "number" ? current.launch_pid : null;
  if (managedPid !== null && isProcessGroupRunning(managedPid)) {
    throw new Error("服务正在启动或尚未就绪，请先停止当前服务后再试。");
  }

  const launchCommand = typeof current.launch_command === "string" ? current.launch_command : "";
  if (!launchCommand) throw new Error("该外部应用没有启动命令。");

  await startExternalProcess({
    command: launchCommand,
    url,
    onSpawn: async (pid) => updateLaunchState(id, pid, new Date().toISOString()),
  });
  return getApplication(id);
}

export async function stopExternalApplication(id: string) {
  const current = getExternalApplicationRow(id);
  if (!current) return null;
  const pid = typeof current.launch_pid === "number" ? current.launch_pid : null;
  if (pid === null) throw new Error("该服务并非由应用中心启动，无法在这里停止。");
  await stopExternalProcess(pid);
  updateLaunchState(id, null, null);
  return getApplication(id);
}

export async function archiveExternalApplication(id: string) {
  const current = getExternalApplicationRow(id);
  if (!current) return false;
  if (typeof current.launch_pid === "number") await stopExternalApplication(id);
  const result = getAgentHubDatabase().prepare("UPDATE applications SET status='archived', updated_at=? WHERE id=?").run(new Date().toISOString(), id);
  return result.changes > 0;
}
