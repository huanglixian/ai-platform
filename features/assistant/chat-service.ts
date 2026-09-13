import { streamText, pruneMessages, stepCountIs, type ModelMessage, type ToolSet } from "ai";

import { getActiveModelRuntime } from "@/features/models/provider";
import { buildSkillRunContext } from "@/features/skills/runner";
import type { AssistantChatMessage, AssistantRuntimeState } from "./chat-types";
import { dispatchAssistantRequest, type AssistantDispatchDecision } from "./dispatcher";
import { buildSkillExecutionPrompt } from "./skill-execution-prompt";
import { getCapabilityImplementation } from "@/features/capabilities/implementation-registry";
import { getCapabilityByHandlerKey } from "@/features/capabilities/server";

const noMatchGuide = "目前似乎没有功能可以直接满足你的需求。你可以浏览平台现有能力，或补充更具体的业务目标。";

function toModelMessages(messages: AssistantChatMessage[]): ModelMessage[] {
  return messages
    .filter((message) => message.content.trim())
    .map((message) => ({
      role: message.role as "user" | "assistant",
      content: message.content.trim(),
    }));
}

function getLatestUserMessage(messages: AssistantChatMessage[]) {
  return [...messages].reverse().find((message) => message.role === "user")?.content.trim() || "";
}

function getMessagesForContext(
  messages: AssistantChatMessage[],
  activeSkillId?: string,
  startedAtMessageIndex?: number
): AssistantChatMessage[] {
  if (
    activeSkillId &&
    startedAtMessageIndex !== undefined &&
    startedAtMessageIndex >= 0 &&
    startedAtMessageIndex < messages.length
  ) {
    return messages.slice(startedAtMessageIndex);
  }
  return messages.slice(-5);
}

export async function streamAssistantResponse(
  messages: AssistantChatMessage[],
  runtimeState?: AssistantRuntimeState
) {
  const latestUserMessage = getLatestUserMessage(messages);

  if (!latestUserMessage) {
    throw new Error("请输入需要处理的任务。");
  }

  let decision: AssistantDispatchDecision;
  if (
    runtimeState?.activeSkillId &&
    runtimeState.skillStatus !== "completed" &&
    runtimeState.skillStatus !== "failed"
  ) {
    decision = {
      action: "use_skill" as const,
      skillId: runtimeState.activeSkillId,
    };
  } else {
    decision = await dispatchAssistantRequest(latestUserMessage);
  }

  if (decision.action === "use_skill" && decision.skillId) {
    const skillContext = buildSkillRunContext(decision.skillId);

    if (skillContext.ok) {
      const modelMessages = toModelMessages(getMessagesForContext(
        messages,
        decision.skillId,
        runtimeState?.startedAtMessageIndex,
      ));
      const prunedMessages = pruneMessages({
        messages: modelMessages,
        toolCalls: "before-last-message",
        emptyMessages: "remove",
      });
      const modelRuntime = getActiveModelRuntime();
      // 根据 allowedTools 动态过滤并挂载本轮可用的 API 工具
      const allowedToolsNames = skillContext.metadata.allowedTools || [];
      const activeTools: ToolSet = {};

      for (const toolName of allowedToolsNames) {
        const capability = getCapabilityByHandlerKey(toolName);
        const implementation = getCapabilityImplementation(toolName);
        if (
          capability?.status === "active" &&
          capability.availability === "available" &&
          implementation
        ) {
          // Vercel AI SDK 键名中不能有点，将点替换为下划线以便兼容。
          activeTools[toolName.replace(/\./g, "_")] = implementation;
        }
      }

      // 如果有可用的工具，才挂载 tools 和 maxSteps，否则不传以保障极致的纯文本流式输出响应性能
      const hasTools = Object.keys(activeTools).length > 0;
      const streamOptions: Parameters<typeof streamText>[0] = {
        model: modelRuntime.model,
        system: buildSkillExecutionPrompt(skillContext),
        messages: prunedMessages,
        temperature: 0.1,
        providerOptions: modelRuntime.providerOptions,
      };

      if (hasTools) {
        streamOptions.tools = activeTools;
        streamOptions.stopWhen = stepCountIs(5);
      }

      return {
        type: "stream" as const,
        stream: streamText(streamOptions),
        skillName: skillContext.skillName,
        activeSkillId: decision.skillId,
        requiresSession: skillContext.metadata.requiresSession,
        completionTools: skillContext.metadata.completionTools,
      };
    }
  }

  if (decision.action === "recommend") {
    return {
      type: "recommendation" as const,
      content: "我找到了可能适合你的平台能力：",
      outcome: { type: "recommendation" as const, recommendations: decision.recommendations },
    };
  }

  return {
    type: "no_match" as const,
    content: noMatchGuide,
    outcome: { type: "no_match" as const },
  };
}
