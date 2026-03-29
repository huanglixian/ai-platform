import type {
  NanobotAgentSummary,
  NanobotBootstrap,
  NanobotSecurityList,
  NanobotSessionDetail,
  NanobotSessionSummary,
} from "./types";

type NanobotResponse<T> = T & {
  ok: boolean;
  error?: string;
};

type CreateAgentPayload = {
  name: string;
  agent_id?: string;
};

type SendMessagePayload = {
  content: string;
  session_key?: string;
};

async function fetchNanobot<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/nanobot${path}`, {
    ...init,
    cache: "no-store",
  });

  let data: NanobotResponse<T>;
  try {
    data = (await response.json()) as NanobotResponse<T>;
  } catch {
    throw new Error("响应格式不正确");
  }

  if (!response.ok || !data.ok) {
    throw new Error(data.error || `请求失败：${response.status}`);
  }

  return data;
}

export async function listNanobotAgents() {
  const data = await fetchNanobot<{ agents: NanobotAgentSummary[] }>("/agents");
  return data.agents || [];
}

export async function createNanobotAgent(payload: CreateAgentPayload) {
  const data = await fetchNanobot<{ agent: NanobotAgentSummary }>("/agents", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return data.agent;
}

export async function getNanobotBootstrap(options: {
  agentId: string;
  sessionKey?: string;
  newSession?: boolean;
}) {
  const query = new URLSearchParams();
  if (options.sessionKey) {
    query.set("session_key", options.sessionKey);
  }
  if (options.newSession) {
    query.set("new", "1");
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return fetchNanobot<NanobotBootstrap>(
    `/agents/${encodeURIComponent(options.agentId)}/bootstrap${suffix}`,
  );
}

export async function getNanobotSessionDetail(agentId: string, sessionKey: string) {
  const data = await fetchNanobot<{
    session_key: string;
    detail: NanobotSessionDetail;
  }>(`/agents/${encodeURIComponent(agentId)}/sessions/${encodeURIComponent(sessionKey)}`);
  return data.detail;
}

export async function sendNanobotMessage(agentId: string, payload: SendMessagePayload) {
  return fetchNanobot<{
    session_key: string;
    user_content: string;
    assistant_content: string;
    sessions: NanobotSessionSummary[];
    detail: NanobotSessionDetail | null;
  }>(`/agents/${encodeURIComponent(agentId)}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function saveNanobotSecurityList(
  agentId: string,
  payload: NanobotSecurityList,
) {
  return fetchNanobot<NanobotSecurityList>(
    `/agents/${encodeURIComponent(agentId)}/security-list`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
}
