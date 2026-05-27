import { exampleSkills } from "@/features/skills/examples";
import type { AnySkillDefinition } from "@/features/skills/skill-types";

const skillRegistry = new Map<string, AnySkillDefinition>();

for (const skill of exampleSkills) {
  if (skillRegistry.has(skill.id)) {
    throw new Error(`重复的技能 ID：${skill.id}`);
  }

  skillRegistry.set(skill.id, skill);
}

export function listSkills() {
  return Array.from(skillRegistry.values());
}

export function listEnabledSkills() {
  return listSkills().filter((skill) => skill.enabled);
}

export function getSkillById(skillId: string) {
  return skillRegistry.get(skillId) ?? null;
}
