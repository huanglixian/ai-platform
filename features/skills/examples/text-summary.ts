import { z } from "zod";

import type { SkillDefinition } from "@/features/skills/skill-types";

const inputSchema = z.object({
  text: z.string().min(20, "文本至少需要 20 个字符"),
  maxPoints: z.number().int().min(1).max(8).default(4),
});

export const textSummarySkill: SkillDefinition<
  z.infer<typeof inputSchema>,
  {
    summary: string;
    keyPoints: string[];
    originalLength: number;
  }
> = {
  id: "text-summary",
  name: "文本摘要",
  description: "将长文本压缩为简短摘要，并提取关键要点。",
  category: "文本处理",
  emoji: "📌",
  featured: true,
  enabled: true,
  owner: "平台内置",
  riskLevel: "low",
  invokeType: "Skill",
  calls: "0",
  tags: ["摘要", "文本整理", "阅读辅助"],
  useCases: ["会议纪要压缩", "长文要点提取", "资料初步整理"],
  inputFields: [
    {
      name: "text",
      label: "待摘要文本",
      type: "string",
      required: true,
      description: "需要整理的原始文本。",
    },
    {
      name: "maxPoints",
      label: "要点数量",
      type: "number",
      required: false,
      description: "最多输出几个关键要点，默认 4 个。",
    },
  ],
  outputDescription: "返回摘要、关键要点和原文长度。",
  callGuide: "适合用户要求总结、提炼、压缩文本时调用。",
  inputSchema,
  execute(input) {
    const normalizedText = input.text.replace(/\s+/g, " ").trim();
    const sentences = normalizedText
      .split(/(?<=[。！？.!?])\s*/)
      .map((item) => item.trim())
      .filter(Boolean);
    const keyPoints = sentences.slice(0, input.maxPoints);

    return {
      summary:
        sentences.slice(0, 2).join("") ||
        normalizedText.slice(0, Math.min(normalizedText.length, 120)),
      keyPoints,
      originalLength: input.text.length,
    };
  },
};
