import { listSkills } from "@/features/skills/registry";
import type { SkillRecord } from "@/features/skills/types";

export function listSkillRecords(): SkillRecord[] {
  return listSkills().map((skill) => ({
    id: skill.id,
    name: skill.name,
    description: skill.description,
    category: skill.category,
    owner: skill.owner,
    enabled: skill.enabled,
    triggers: skill.triggers,
    referenceFiles: skill.referenceFiles.map(r => r.name),
  }));
}
