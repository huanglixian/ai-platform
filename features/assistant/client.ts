import type { AssistantChatMessage, AssistantRuntimeState } from "./chat-types";

type ApiResponse<T> = T & {
  ok: boolean;
  error?: string;
};

export async function streamAssistantChat(
  messages: AssistantChatMessage[],
  runtimeState?: AssistantRuntimeState,
  handlers: {
    onDelta?: (delta: string) => void;
  } = {},
) {
  const response = await fetch("/api/platform/assistant/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify({ messages, runtimeState }),
  });

  if (!response.ok) {
    try {
      const payload = (await response.json()) as ApiResponse<Record<string, unknown>>;
      throw new Error(payload.error || "AI 助手回复失败");
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("AI 助手回复失败");
    }
  }

  if (!response.body) {
    throw new Error("后端未返回流式响应");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let content = "";

  while (true) {
    const { value, done } = await reader.read();
    const delta = decoder.decode(value || new Uint8Array(), { stream: !done });

    if (delta) {
      content += delta;
      handlers.onDelta?.(delta);
    }

    if (done) {
      break;
    }
  }

  return content;
}
