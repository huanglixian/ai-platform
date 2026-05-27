import { listSkills } from "@/features/skills/registry";
import type { SkillRecord } from "@/features/skills/types";

export function listSkillRecords(): SkillRecord[] {
  return listSkills().map((skill) => ({
    id: skill.id,
    name: skill.name,
    description: skill.description,
    invokeType: skill.invokeType,
    calls: skill.calls,
    featured: skill.featured,
    emoji: skill.emoji,
    category: skill.category,
    owner: skill.owner,
    enabled: skill.enabled,
    riskLevel: skill.riskLevel,
    tags: skill.tags,
    useCases: skill.useCases,
    inputFields: skill.inputFields,
    outputDescription: skill.outputDescription,
    callGuide: skill.callGuide,
  }));
}

export const skillRecords = listSkillRecords();
