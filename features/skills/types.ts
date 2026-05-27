import type { CapabilityRecord } from "@/features/capabilities/types";
import type { SkillInputField, SkillRiskLevel } from "@/features/skills/skill-types";

export type SkillRecord = CapabilityRecord & {
  owner: string;
  enabled: boolean;
  riskLevel: SkillRiskLevel;
  tags: string[];
  useCases: string[];
  inputFields: SkillInputField[];
  outputDescription: string;
  callGuide: string;
};
