import { streamText, pruneMessages, stepCountIs, type ModelMessage, type ToolSet } from "ai";

import { getActiveModelRuntime } from "@/features/models/provider";
import { buildSkillRunContext } from "@/features/skills/runner";
import { routeSkill } from "@/features/skills/router";
import type { WorkbenchChatMessage, WorkbenchRuntimeState } from "@/features/workbench/chat-types";
import { getWorkbenchCapabilityContext } from "@/features/workbench/capability-context";
import { buildWorkbenchRecommendationPrompt } from "@/features/workbench/recommendation-prompt";
import { buildSkillExecutionPrompt } from "@/features/workbench/skill-execution-prompt";
import { getCapabilityImplementation } from "@/features/capabilities/implementation-registry";
import { getCapabilityByHandlerKey } from "@/features/capabilities/server";

function toModelMessages(messages: WorkbenchChatMessage[]): ModelMessage[] {
  return messages
    .filter((message) => message.content.trim())
    .map((message) => ({
      role: message.role as "user" | "assistant",
      content: message.content.trim(),
    }));
}

function getLatestUserMessage(messages: WorkbenchChatMessage[]) {
  return [...messages].reverse().find((message) => message.role === "user")?.content.trim() || "";
}

function getMessagesForContext(
  messages: WorkbenchChatMessage[],
  activeSkillId?: string,
  startedAtMessageIndex?: number
): WorkbenchChatMessage[] {
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

export async function streamWorkbenchRecommendation(
  messages: WorkbenchChatMessage[],
  runtimeState?: WorkbenchRuntimeState
) {
  const latestUserMessage = getLatestUserMessage(messages);

  if (!latestUserMessage) {
    throw new Error("请输入需要处理的任务。");
  }

  const modelRuntime = getActiveModelRuntime();
  
  let decision;
  if (
    runtimeState?.activeSkillId &&
    runtimeState.skillStatus !== "completed" &&
    runtimeState.skillStatus !== "failed"
  ) {
    decision = {
      action: "use_skill" as const,
      skillId: runtimeState.activeSkillId,
      reason: "continue active skill session",
    };
  } else {
    decision = await routeSkill(latestUserMessage);
  }

  // 根据当前是否有激活技能来定向过滤出所需的对话上下文
  const slicedMessages = getMessagesForContext(
    messages,
    decision.skillId || undefined,
    runtimeState?.startedAtMessageIndex
  );
  const modelMessages = toModelMessages(slicedMessages);

  // 对模型输入的消息使用 pruneMessages 进行老旧工具调用与空白内容的剪枝优化，以省 token
  const prunedMessages = pruneMessages({
    messages: modelMessages,
    toolCalls: "before-last-message",
    emptyMessages: "remove",
  });

  if (decision.action === "use_skill" && decision.skillId) {
    const skillContext = buildSkillRunContext(decision.skillId);

    if (skillContext.ok) {
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
        stream: streamText(streamOptions),
        skillName: skillContext.skillName,
        activeSkillId: decision.skillId,
        requiresSession: skillContext.metadata.requiresSession,
        completionTools: skillContext.metadata.completionTools,
      };
    }
  }

  const capabilityContext = getWorkbenchCapabilityContext(latestUserMessage);

  return {
    stream: streamText({
      model: modelRuntime.model,
      system: buildWorkbenchRecommendationPrompt(capabilityContext),
      messages: prunedMessages,
      temperature: 0.2,
      providerOptions: modelRuntime.providerOptions,
    }),
    activeSkillId: null,
  };
}
