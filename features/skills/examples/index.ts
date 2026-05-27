import { enterpriseTaskSkill } from "@/features/skills/examples/enterprise-task";
import { requirementStructureSkill } from "@/features/skills/examples/requirement-structure";
import { textSummarySkill } from "@/features/skills/examples/text-summary";
import type { AnySkillDefinition } from "@/features/skills/skill-types";

export const exampleSkills: AnySkillDefinition[] = [
  textSummarySkill,
  requirementStructureSkill,
  enterpriseTaskSkill,
];
