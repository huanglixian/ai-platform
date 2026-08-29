import { z } from "zod";
import { getAgentHubDatabase } from "@/lib/agenthub/database";
import { INITIAL_APPS } from "./mock-data";
import type { PublishedApp } from "./types";

export const applicationInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).default(""),
  producer: z.string().trim().min(1).max(80).default("agenthub"),
  kind: z.string().trim().min(1).max(40).default("application"),
  runtime: z.string().trim().min(1).max(40).default("web"),
  status: z.enum(["active", "archived", "disabled"]).default("active"),
  entryUrl: z.string().trim().url().or(z.string().trim().startsWith("/")),
  version: z.string().trim().max(40).default("1.0.0"),
  externalId: z.string().trim().max(120).optional(),
});

function rowToApp(row: Record<string, unknown>): PublishedApp {
  const source = row.producer === "dify" || row.producer === "n8n" ? row.producer : "native";
  return {
    id: String(row.id), name: String(row.name), description: String(row.description ?? ""),
    source, appType: row.kind === "business" ? "business" : "general",
    url: String(row.entry_url ?? "/workbench"), createdAt: String(row.created_at), updatedAt: String(row.updated_at),
  };
}

export function seedApplications() {
  const db = getAgentHubDatabase();
  const insert = db.prepare(`INSERT OR IGNORE INTO applications
    (id,name,description,producer,kind,runtime,status,entry_url,version,created_at,updated_at)
    VALUES (@id,@name,@description,@producer,@kind,@runtime,'active',@entryUrl,'1.0.0',@createdAt,@updatedAt)`);
  const seed = db.transaction(() => INITIAL_APPS.forEach((app) => insert.run({
    id: app.id, name: app.name, description: app.description, producer: app.source,
    kind: app.appType, runtime: "web", entryUrl: app.url, createdAt: app.createdAt, updatedAt: app.updatedAt,
  })));
  seed();
}

export function listApplications() {
  seedApplications();
  return (getAgentHubDatabase().prepare("SELECT * FROM applications WHERE status != 'archived' ORDER BY created_at DESC").all() as Record<string, unknown>[]).map(rowToApp);
}

export function createApplication(input: z.infer<typeof applicationInputSchema>) {
  const now = new Date().toISOString();
  const id = `app-${crypto.randomUUID()}`;
  getAgentHubDatabase().prepare(`INSERT INTO applications
    (id,name,description,producer,kind,runtime,status,entry_url,version,external_id,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(id,input.name,input.description,input.producer,input.kind,input.runtime,input.status,input.entryUrl,input.version,input.externalId ?? null,now,now);
  return getApplication(id);
}

export function getApplication(id: string) {
  const row = getAgentHubDatabase().prepare("SELECT * FROM applications WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  return row ? rowToApp(row) : null;
}

export function archiveApplication(id: string) {
  const result = getAgentHubDatabase().prepare("UPDATE applications SET status='archived', updated_at=? WHERE id=?").run(new Date().toISOString(), id);
  return result.changes > 0;
}

export function updateApplication(id: string, input: Partial<z.infer<typeof applicationInputSchema>>) {
  const current = getAgentHubDatabase().prepare("SELECT * FROM applications WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  if (!current) return null;
  const next = { name: String(current.name), description: String(current.description ?? ""), producer: String(current.producer), kind: String(current.kind), runtime: String(current.runtime), status: String(current.status), entryUrl: String(current.entry_url ?? ""), version: String(current.version ?? "1.0.0"), externalId: current.external_id ? String(current.external_id) : undefined, ...input };
  getAgentHubDatabase().prepare(`UPDATE applications SET name=?,description=?,producer=?,kind=?,runtime=?,status=?,entry_url=?,version=?,external_id=?,updated_at=? WHERE id=?`).run(next.name,next.description,next.producer,next.kind,next.runtime,next.status,next.entryUrl,next.version,next.externalId ?? null,new Date().toISOString(),id);
  return getApplication(id);
}
