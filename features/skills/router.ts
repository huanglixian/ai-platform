import { generateText } from "ai";
import { z } from "zod";

import { getActiveModelRuntime } from "@/features/models/provider";
import { listEnabledSkills } from "@/features/skills/registry";

const skillRouterSchema = z.object({
  action: z.enum(["use_skill", "normal_chat"]),
  skillId: z.string().nullable(),
  reason: z.string(),
});

export type SkillRouterDecision = z.infer<typeof skillRouterSchema>;

function buildSkillRouterPrompt(userInput: string) {
  const skills = listEnabledSkills().map((skill) => ({
    id: skill.id,
    name: skill.name,
    description: skill.description,
    category: skill.category,
    triggers: skill.triggers,
  }));

  return [
    "你是技能路由器，只判断用户当前请求是否应该调用一个技能。",
    "你只能基于可用技能 metadata 做选择，不执行任务，不回答用户问题。",
    "你必须只输出一行 JSON，不要输出 Markdown，不要输出代码块，不要输出解释。",
    'JSON 格式固定为：{"action":"use_skill|normal_chat","skillId":"技能 ID 或 null","reason":"简短原因"}',
    "",
    "判断规则：",
    "1. 只有当用户明确要求处理一个具体任务，并且某个技能的 name、description 或 triggers 明显匹配时，才返回 use_skill。",
    "2. 不确定、只是弱相关、只是讨论能力、询问有哪些技能、询问怎么做、缺少待处理内容时，必须返回 normal_chat。",
    "3. 不要为了使用技能而勉强匹配。没有非常明确的匹配就返回 normal_chat。",
    "4. 如果多个技能都可能匹配，只选择最直接、最具体的一个。",
    "5. 对“帮我总结下面内容”“提取要点”“整理成摘要”“概括这段内容”这类带有待处理内容的请求，应选择文本摘要类技能。",
    "6. normal_chat 时 skillId 必须为 null。",
    "",
    "可用技能 metadata：",
    JSON.stringify(skills, null, 2),
    "",
    "用户当前请求：",
    userInput,
  ].join("\n");
}

function fallbackDecision(reason: string): SkillRouterDecision {
  return {
    action: "normal_chat",
    skillId: null,
    reason,
  };
}

function parseRouterText(text: string) {
  const trimmed = text.trim();
  const jsonText = trimmed.match(/\{[\s\S]*\}/)?.[0] ?? trimmed;
  const parsed = skillRouterSchema.safeParse(JSON.parse(jsonText));

  if (!parsed.success) {
    return null;
  }

  return parsed.data;
}

export async function routeSkill(userInput: string): Promise<SkillRouterDecision> {
  try {
    const modelRuntime = getActiveModelRuntime();
    const result = await generateText({
      model: modelRuntime.model,
      prompt: buildSkillRouterPrompt(userInput),
      temperature: 0,
      providerOptions: modelRuntime.providerOptions,
    });
    const decision = parseRouterText(result.text);

    if (!decision) {
      return fallbackDecision("路由输出无法解析，回退普通对话。");
    }

    if (decision.action === "normal_chat") {
      return {
        ...decision,
        skillId: null,
      };
    }

    if (!decision.skillId) {
      return fallbackDecision("路由结果缺少技能 ID，回退普通对话。");
    }

    return decision;
  } catch {
    return fallbackDecision("路由判断失败，回退普通对话。");
  }
}
