import type { CapabilityRecord } from "@/features/capabilities/types";

export type SkillRecord = CapabilityRecord & {
  owner: string;
};
