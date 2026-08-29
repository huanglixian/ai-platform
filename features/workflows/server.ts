import { z } from "zod";
import { getAgentHubDatabase } from "@/lib/agenthub/database";
import { INITIAL_WORKFLOWS } from "./mock-data";
import type { Workflow } from "./types";

const workflowSchema = z.object({
  name: z.string().trim().min(1).max(120), description: z.string().trim().max(2000).default(""),
  category: z.string().trim().min(1).max(40), nodes: z.array(z.unknown()).default([]), edges: z.array(z.unknown()).default([]),
});
const mapRow = (row: Record<string, unknown>): Workflow => { const definition=JSON.parse(String(row.definition_json)); return { id: String(row.id), name: String(row.name), description: String(row.description), category: String(row.category ?? definition.category ?? "业务审批") as Workflow["category"], nodes: definition.nodes ?? [], edges: definition.edges ?? [], createdAt: String(row.created_at), updatedAt: String(row.updated_at) }; };
export function seedWorkflows() { const db = getAgentHubDatabase(); const insert = db.prepare(`INSERT OR IGNORE INTO workflows (id,name,description,status,definition_json,created_at,updated_at) VALUES (?,?,?,?,?,?,?)`); db.transaction(() => INITIAL_WORKFLOWS.forEach((w) => insert.run(w.id,w.name,w.description,"active",JSON.stringify({nodes:w.nodes,edges:w.edges,category:w.category}),w.createdAt,w.updatedAt)))(); }
export function listWorkflows() { seedWorkflows(); return (getAgentHubDatabase().prepare("SELECT * FROM workflows WHERE status != 'archived' ORDER BY created_at DESC").all() as Record<string,unknown>[]).map(mapRow); }
export function getWorkflow(id: string) { const row = getAgentHubDatabase().prepare("SELECT * FROM workflows WHERE id=?").get(id) as Record<string,unknown>|undefined; return row ? mapRow(row) : null; }
export function upsertWorkflow(id: string|undefined, input: z.infer<typeof workflowSchema>) { const db=getAgentHubDatabase(); const now=new Date().toISOString(); const workflowId=id ?? `workflow-${crypto.randomUUID()}`; const existing=getWorkflow(workflowId); if(existing){ db.prepare("UPDATE workflows SET name=?,description=?,definition_json=?,version=version+1,updated_at=? WHERE id=?").run(input.name,input.description,JSON.stringify({nodes:input.nodes,edges:input.edges,category:input.category}),now,workflowId); } else { db.prepare("INSERT INTO workflows (id,name,description,status,definition_json,created_at,updated_at) VALUES (?,?,?,?,?,?,?)").run(workflowId,input.name,input.description,"active",JSON.stringify({nodes:input.nodes,edges:input.edges,category:input.category}),now,now); } return getWorkflow(workflowId); }
export function archiveWorkflow(id:string){ return getAgentHubDatabase().prepare("UPDATE workflows SET status='archived',updated_at=? WHERE id=?").run(new Date().toISOString(),id).changes>0; }
export { workflowSchema };
