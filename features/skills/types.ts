export type SkillRecord = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: string;
  owner: string;
  triggers: string[];
  referenceFiles: string[];
};
