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

  return {
    ok: true,
    skillId,
    skillName: skill.name,
    status: "ready",
    instruction: skillMarkdown,
    metadata: metadata as SkillMetadata,
    references: referenceFiles.map((r) => r.name),
  };
}
