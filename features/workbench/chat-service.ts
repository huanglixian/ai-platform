import { streamText, type ModelMessage } from "ai";

import { getActiveModelRuntime } from "@/features/models/provider";
import { buildSkillRunContext } from "@/features/skills/runner";
import { routeSkill } from "@/features/skills/router";
import type { WorkbenchChatMessage, WorkbenchRuntimeState } from "@/features/workbench/chat-types";
import { getWorkbenchCapabilityContext } from "@/features/workbench/capability-context";
import { buildWorkbenchRecommendationPrompt } from "@/features/workbench/recommendation-prompt";
import { buildSkillExecutionPrompt } from "@/features/workbench/skill-execution-prompt";
import { toolRegistry } from "@/features/services/tool-registry";

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

  if (decision.action === "use_skill" && decision.skillId) {
    const skillContext = buildSkillRunContext(decision.skillId);

    if (skillContext.ok) {
      // 根据 allowedTools 动态过滤并挂载本轮可用的 API 工具
      const allowedToolsNames = skillContext.metadata.allowedTools || [];
      const activeTools: Record<string, any> = {};

      for (const toolName of allowedToolsNames) {
        if (toolRegistry[toolName]) {
          activeTools[toolName.replace(/\./g, "_")] = toolRegistry[toolName]; // Vercel AI SDK 键名中不能有点，将点替换为下划线以便兼容
        }
      }

      return {
        stream: streamText({
          model: modelRuntime.model,
          system: buildSkillExecutionPrompt(skillContext),
          messages: toModelMessages(messages),
          tools: activeTools,
          maxSteps: 5,
          temperature: 0.1,
          providerOptions: modelRuntime.providerOptions,
        } as any),
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
      messages: toModelMessages(messages),
      temperature: 0.2,
      providerOptions: modelRuntime.providerOptions,
    }),
    activeSkillId: null,
  };
}

