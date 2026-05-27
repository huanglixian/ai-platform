import { streamText, type ModelMessage } from "ai";

import { getActiveModelRuntime } from "@/features/models/provider";
import { buildSkillRunContext } from "@/features/skills/runner";
import { routeSkill } from "@/features/skills/router";
import type { WorkbenchChatMessage } from "@/features/workbench/chat-types";
import { getWorkbenchCapabilityContext } from "@/features/workbench/capability-context";
import { buildWorkbenchRecommendationPrompt } from "@/features/workbench/recommendation-prompt";
import { buildSkillExecutionPrompt } from "@/features/workbench/skill-execution-prompt";

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

export async function streamWorkbenchRecommendation(messages: WorkbenchChatMessage[]) {
  const latestUserMessage = getLatestUserMessage(messages);

  if (!latestUserMessage) {
    throw new Error("请输入需要处理的任务。");
  }

  const modelRuntime = getActiveModelRuntime();
  const decision = await routeSkill(latestUserMessage);

  if (decision.action === "use_skill" && decision.skillId) {
    const skillContext = buildSkillRunContext(decision.skillId);

    if (skillContext.ok) {
      return {
        stream: streamText({
          model: modelRuntime.model,
          system: buildSkillExecutionPrompt(skillContext),
          messages: toModelMessages(messages),
          temperature: 0.2,
          providerOptions: modelRuntime.providerOptions,
        }),
        skillName: skillContext.skillName,
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
  };
}
