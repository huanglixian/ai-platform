export type SkillMetadata = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: string;
  owner: string;
  triggers: string[];
  allowedTools?: string[];
};

export type SkillPackage = SkillMetadata & {
  baseDir: string;
  skillMarkdown: string;
  referenceFiles: string[];
};

export type SkillRunContext = {
  ok: true;
  skillId: string;
  skillName: string;
  status: "ready";
  instruction: string;
  metadata: SkillMetadata;
  references: string[];
};

export type SkillRunFailure = {
  ok: false;
  skillId: string;
  error: string;
};

export type SkillRunResult = SkillRunContext | SkillRunFailure;
