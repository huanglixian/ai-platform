import { getAgentHubDatabase } from "@/lib/agenthub/database";
import { toolRecords } from "@/features/tools/data";
import { serviceRecords } from "@/features/services/data";
import { listSkillRecords } from "@/features/skills/data";
import type { CapabilityKind } from "./types";

function seedRows() {
  const rows = [
    ...toolRecords.map((item) => ({ ...item, kind: "tool" as CapabilityKind, protocol: item.invokeType })),
    ...serviceRecords.map((item) => ({ ...item, kind: "service" as CapabilityKind, protocol: item.invokeType })),
    ...listSkillRecords().map((item) => ({ ...item, invokeType: "skill", calls: "0", featured: item.enabled, emoji: "✦", kind: "skill" as CapabilityKind, protocol: "internal" })),
  ];
  const db = getAgentHubDatabase();
  const insert = db.prepare(`INSERT OR IGNORE INTO capabilities (id,version,name,description,kind,protocol,schema_json,handler_key,status,availability,created_at,updated_at) VALUES (?,?,?,?,?,?,?,'',?,'available',?,?)`);
  const now = new Date().toISOString();
  db.transaction(() => rows.forEach((item) => insert.run(item.id,"1.0.0",item.name,item.description,item.kind,item.protocol,JSON.stringify({ category: item.category }),item.kind === "skill" && "enabled" in item && !item.enabled ? "disabled" : "active",now,now)))();
}

export function listCapabilities(kind?: CapabilityKind) { seedRows(); const db=getAgentHubDatabase(); const rows=(kind ? db.prepare("SELECT * FROM capabilities WHERE kind=? ORDER BY name").all(kind) : db.prepare("SELECT * FROM capabilities ORDER BY kind,name").all()) as Record<string,unknown>[]; return rows.map((row) => ({ id:String(row.id), version:String(row.version), name:String(row.name), description:String(row.description), kind:String(row.kind), protocol:String(row.protocol), schema:JSON.parse(String(row.schema_json)), handlerKey:row.handler_key || null, endpoint:row.endpoint || null, credentialRef:row.credential_ref || null, status:String(row.status), availability:String(row.availability) })); }
export function getCapability(id:string){ return listCapabilities().find((item)=>item.id===id) ?? null; }
