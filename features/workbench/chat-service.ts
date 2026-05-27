import { streamText, type ModelMessage } from "ai";

import { getActiveModelRuntime } from "@/features/models/provider";
import type { WorkbenchChatMessage } from "@/features/workbench/chat-types";
import { getWorkbenchCapabilityContext } from "@/features/workbench/capability-context";
import { buildWorkbenchRecommendationPrompt } from "@/features/workbench/recommendation-prompt";

function toModelMessages(messages: WorkbenchChatMessage[]): ModelMessage[] {
  return messages
    .filter((message) => message.content.trim())
    .map((message) => ({
      role: message.role,
      content: message.content.trim(),
    }));
}

function getLatestUserMessage(messages: WorkbenchChatMessage[]) {
  return [...messages].reverse().find((message) => message.role === "user")?.content.trim() || "";
}

export function streamWorkbenchRecommendation(messages: WorkbenchChatMessage[]) {
  const latestUserMessage = getLatestUserMessage(messages);

  if (!latestUserMessage) {
    throw new Error("请输入需要处理的任务。");
  }

  const capabilityContext = getWorkbenchCapabilityContext(latestUserMessage);
  const modelRuntime = getActiveModelRuntime();

  return streamText({
    model: modelRuntime.model,
    system: buildWorkbenchRecommendationPrompt(capabilityContext),
    messages: toModelMessages(messages),
    temperature: 0.2,
    providerOptions: modelRuntime.providerOptions,
  });
}
