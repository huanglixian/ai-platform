export type AgentHubMode = "disabled" | "local" | "http";
export interface AgentHubClient { listCapabilities(): Promise<unknown[]>; registerApplication(input: Record<string, unknown>): Promise<unknown>; }
export function createAgentHubClient(mode: AgentHubMode, baseUrl = process.env.AGENT_HUB_BASE_URL): AgentHubClient {
  if (mode === "disabled") return { async listCapabilities(){ return []; }, async registerApplication(){ throw new Error("AgentHub 集成已禁用"); } };
  const root = mode === "http" ? baseUrl : "http://localhost:19844";
  if (!root) throw new Error("缺少 AGENT_HUB_BASE_URL");
  return { async listCapabilities(){ const response=await fetch(`${root}/api/agenthub/v1/capabilities`); if(!response.ok) throw new Error("AgentHub 能力查询失败"); return ((await response.json()) as {data:unknown[]}).data; }, async registerApplication(input){ const response=await fetch(`${root}/api/agenthub/v1/applications`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(input)}); if(!response.ok) throw new Error("AgentHub 应用注册失败"); return (await response.json() as {data:unknown}).data; } };
}
