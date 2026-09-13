import type { SkillRunContext } from "@/features/skills/skill-types";

export function buildSkillExecutionPrompt(skillContext: SkillRunContext) {
  return [
    `你正在执行技能：${skillContext.skillName}。`,
    "你必须严格按照 SKILL.md 的说明处理用户当前任务。",
    "不要向用户解释你选择了哪个技能，也不要输出能力推荐。",
    "如果用户输入缺少执行该技能所需的内容，请直接说明缺少什么，并提出具体补充项。",
    "回答必须使用中文，保持简洁、直接、可交付。",
    "",
    "SKILL.md 内容如下：",
    skillContext.instruction,
  ].join("\n");
}
