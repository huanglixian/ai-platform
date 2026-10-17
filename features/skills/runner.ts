import { getSkillById } from "@/features/skills/registry";
import type { SkillMetadata, SkillRunResult } from "@/features/skills/skill-types";

export function buildSkillRunContext(skillId: string): SkillRunResult {
  const skill = getSkillById(skillId);

  if (!skill) {
    return {
      ok: false,
      skillId,
      error: "未找到对应技能",
    };
  }

  if (!skill.enabled) {
    return {
      ok: false,
      skillId,
      error: "该技能当前未启用",
    };
  }

  const { baseDir, skillMarkdown, referenceFiles, ...metadata } = skill;
  void baseDir;

  const referenceInstructions = referenceFiles.map((file) => [
    `### ${file.name}`,
    `引用地址：/api/platform/skills/${encodeURIComponent(skill.id)}/references/${encodeURIComponent(file.name.slice("references/".length))}`,
    file.content,
  ].join("\n\n"));

  return {
    ok: true,
    skillId,
    skillName: skill.name,
    status: "ready",
    instruction: referenceInstructions.length
      ? [skillMarkdown, "## 随技能提供的参考文件", ...referenceInstructions].join("\n\n")
      : skillMarkdown,
    metadata: metadata as SkillMetadata,
    references: referenceFiles.map((r) => r.name),
  };
}
