import { getAgentHubDatabase } from "@/lib/agenthub/database";
import { serviceRecords } from "@/features/services/data";
import { listSkillRecords } from "@/features/skills/data";
import { toolRecords } from "@/features/tools/data";
import type { CapabilityKind } from "./types";

export type RegisteredCapability = {
  id: string;
  version: string;
  name: string;
  description: string;
  kind: CapabilityKind;
  protocol: string;
  schema: Record<string, unknown>;
  handlerKey: string | null;
  endpoint: string | null;
  credentialRef: string | null;
  status: string;
  availability: string;
};

const executableCapabilities = [
  {
    id: "create-skill-tool",
    name: "创建技能工具",
    description: "在 AgentHub 技能目录内创建正式技能包。",
    kind: "tool" as const,
    protocol: "internal",
    category: "平台管理",
    handlerKey: "create_skill",
  },
  {
    id: "skills-flow-tool",
    name: "技能流程图工具",
    description: "根据技能指令生成并保存 Mermaid 流程图。",
    kind: "tool" as const,
    protocol: "internal",
    category: "平台管理",
    handlerKey: "skills_flow",
  },
];

function seedRows() {
  const rows = [
    ...toolRecords.map((item) => ({
      ...item,
      kind: "tool" as CapabilityKind,
      protocol: item.invokeType,
      handlerKey: "",
    })),
    ...serviceRecords.map((item) => ({
      ...item,
      kind: "service" as CapabilityKind,
      protocol: item.invokeType,
      handlerKey: item.id === "tower-weight-estimation" ? "tower.match.search" : "",
    })),
    ...listSkillRecords().map((item) => ({
      ...item,
      invokeType: "skill",
      calls: "0",
      featured: item.enabled,
      emoji: "✦",
      kind: "skill" as CapabilityKind,
      protocol: "internal",
      handlerKey: "",
    })),
    ...executableCapabilities.map((item) => ({
      ...item,
      invokeType: item.protocol,
      calls: "0",
      featured: false,
      emoji: "⌘",
    })),
  ];
  const db = getAgentHubDatabase();
  const insert = db.prepare(`
    INSERT INTO capabilities (
      id, version, name, description, kind, protocol, schema_json, handler_key,
      status, availability, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'available', ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      description = excluded.description,
      kind = excluded.kind,
      protocol = excluded.protocol,
      schema_json = excluded.schema_json,
      handler_key = CASE
        WHEN excluded.handler_key <> '' THEN excluded.handler_key
        ELSE capabilities.handler_key
      END,
      updated_at = excluded.updated_at
  `);
  const now = new Date().toISOString();
  db.transaction(() =>
    rows.forEach((item) =>
      insert.run(
        item.id,
        "1.0.0",
        item.name,
        item.description,
        item.kind,
        item.protocol,
        JSON.stringify({ category: item.category }),
        item.handlerKey,
        item.kind === "skill" && "enabled" in item && !item.enabled ? "disabled" : "active",
        now,
        now,
      ),
    ),
  )();
}

function mapCapability(row: Record<string, unknown>): RegisteredCapability {
  return {
    id: String(row.id),
    version: String(row.version),
    name: String(row.name),
    description: String(row.description),
    kind: String(row.kind) as CapabilityKind,
    protocol: String(row.protocol),
    schema: JSON.parse(String(row.schema_json)) as Record<string, unknown>,
    handlerKey: row.handler_key ? String(row.handler_key) : null,
    endpoint: row.endpoint ? String(row.endpoint) : null,
    credentialRef: row.credential_ref ? String(row.credential_ref) : null,
    status: String(row.status),
    availability: String(row.availability),
  };
}

export function listCapabilities(kind?: CapabilityKind) {
  seedRows();
  const db = getAgentHubDatabase();
  const rows = (kind
    ? db.prepare("SELECT * FROM capabilities WHERE kind = ? ORDER BY name").all(kind)
    : db.prepare("SELECT * FROM capabilities ORDER BY kind, name").all()) as Record<
    string,
    unknown
  >[];
  return rows.map(mapCapability);
}

export function getCapability(id: string) {
  seedRows();
  const row = getAgentHubDatabase()
    .prepare("SELECT * FROM capabilities WHERE id = ?")
    .get(id) as Record<string, unknown> | undefined;
  return row ? mapCapability(row) : null;
}

export function getCapabilityByHandlerKey(handlerKey: string) {
  seedRows();
  const row = getAgentHubDatabase()
    .prepare("SELECT * FROM capabilities WHERE handler_key = ?")
    .get(handlerKey) as Record<string, unknown> | undefined;
  return row ? mapCapability(row) : null;
}
