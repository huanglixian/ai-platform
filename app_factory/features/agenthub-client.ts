export interface AgentHubClient {
  listCapabilities(): Promise<unknown[]>;
  registerApplication(input: Record<string, unknown>): Promise<unknown>;
  invokeCapability(capabilityId: string, input: unknown): Promise<unknown>;
}

function agentHubBaseUrl() {
  const baseUrl = process.env.AGENT_HUB_BASE_URL?.trim();
  if (!baseUrl) throw new Error("缺少 AGENT_HUB_BASE_URL");
  return baseUrl.replace(/\/$/, "");
}

export function createAgentHubClient(): AgentHubClient {
  const root = agentHubBaseUrl();
  return {
    async listCapabilities() {
      const response = await fetch(`${root}/api/agenthub/v1/capabilities`);
      if (!response.ok) throw new Error("AgentHub 能力查询失败");
      return ((await response.json()) as { data: unknown[] }).data;
    },
    async registerApplication(input) {
      const response = await fetch(`${root}/api/agenthub/v1/applications`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error("AgentHub 应用注册失败");
      return (await response.json() as { data: unknown }).data;
    },
    async invokeCapability(capabilityId, input) {
      const response = await fetch(
        `${root}/api/agenthub/v1/capabilities/${encodeURIComponent(capabilityId)}/invoke`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ input }),
        },
      );
      const payload = await response.json() as { data?: unknown; error?: { message?: string } };
      if (!response.ok) throw new Error(payload.error?.message || "AgentHub 能力调用失败");
      return payload.data;
    },
  };
}
