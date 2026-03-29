import type {
  NanobotAgentSummary,
  NanobotBootstrap,
  NanobotChatResult,
  NanobotSecurityList,
  NanobotSessionDetail,
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

type StreamMessageHandlers = {
  onProgress?: (message: string) => void;
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
  return fetchNanobot<NanobotChatResult>(`/agents/${encodeURIComponent(agentId)}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

function parseSseBlock(block: string) {
  const lines = block.split("\n");
  let event = "message";
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
      continue;
    }
    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  if (!dataLines.length) {
    return null;
  }

  const raw = dataLines.join("\n");
  try {
    return {
      event,
      data: JSON.parse(raw) as Record<string, unknown>,
    };
  } catch {
    return {
      event,
      data: { message: raw },
    };
  }
}

export async function streamNanobotMessage(
  agentId: string,
  payload: SendMessagePayload,
  handlers: StreamMessageHandlers = {},
) {
  const response = await fetch(
    `/api/nanobot/agents/${encodeURIComponent(agentId)}/chat/stream`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    let message = `请求失败：${response.status}`;
    try {
      const data = (await response.json()) as NanobotResponse<Record<string, unknown>>;
      message = data.error || message;
    } catch {}
    throw new Error(message);
  }

  if (!response.body) {
    throw new Error("后端未返回流式响应");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: NanobotChatResult | null = null;
  let streamError = "";

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    buffer = buffer.replace(/\r/g, "");

    let separatorIndex = buffer.indexOf("\n\n");
    while (separatorIndex >= 0) {
      const chunk = buffer.slice(0, separatorIndex).trim();
      buffer = buffer.slice(separatorIndex + 2);
      separatorIndex = buffer.indexOf("\n\n");

      if (!chunk) {
        continue;
      }

      const parsed = parseSseBlock(chunk);
      if (!parsed) {
        continue;
      }

      if (parsed.event === "progress") {
        const message = String(parsed.data.message || "").trim();
        if (message) {
          handlers.onProgress?.(message);
        }
        continue;
      }

      if (parsed.event === "error") {
        streamError = String(parsed.data.error || "处理失败");
        continue;
      }

      if (parsed.event === "done") {
        result = parsed.data as unknown as NanobotChatResult;
      }
    }

    if (done) {
      break;
    }
  }

  if (streamError) {
    throw new Error(streamError);
  }

  if (!result) {
    throw new Error("流式响应提前结束");
  }

  return result;
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
