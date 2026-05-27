import { z } from "zod";

import type { SkillDefinition } from "@/features/skills/skill-types";

const inputSchema = z.object({
  requirement: z.string().min(10, "需求描述至少需要 10 个字符"),
  domain: z.string().optional(),
});

export const requirementStructureSkill: SkillDefinition<
  z.infer<typeof inputSchema>,
  {
    goal: string;
    scope: string[];
    constraints: string[];
    openQuestions: string[];
  }
> = {
  id: "requirement-structure",
  name: "需求结构化整理",
  description: "把自然语言需求整理为目标、范围、约束和待确认问题。",
  category: "文本处理",
  emoji: "🧩",
  featured: true,
  enabled: true,
  owner: "平台内置",
  riskLevel: "low",
  invokeType: "Skill",
  calls: "0",
  tags: ["需求分析", "结构化", "任务拆解"],
  useCases: ["需求澄清", "任务拆解", "PRD 初稿整理"],
  inputFields: [
    {
      name: "requirement",
      label: "需求描述",
      type: "string",
      required: true,
      description: "用户原始需求文本。",
    },
    {
      name: "domain",
      label: "业务领域",
      type: "string",
      required: false,
      description: "可选的业务领域，用于辅助归类。",
    },
  ],
  outputDescription: "返回目标、范围、约束和待确认问题。",
  callGuide: "适合用户表达一个待拆解任务或产品需求时调用。",
  inputSchema,
  execute(input) {
    const text = input.requirement.trim();
    const chunks = text
      .split(/[。；;，,\n]/)
      .map((item) => item.trim())
      .filter(Boolean);

    return {
      goal: input.domain ? `${input.domain}：${chunks[0] ?? text}` : chunks[0] ?? text,
      scope: chunks.slice(1, 5),
      constraints: chunks.filter((item) => /必须|不能|不要|限制|要求|需要/.test(item)).slice(0, 4),
      openQuestions: [
        "是否有明确的完成标准？",
        "是否涉及权限、数据或外部系统边界？",
        "是否需要分阶段交付？",
      ],
    };
  },
};
