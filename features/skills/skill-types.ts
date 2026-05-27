import type { z } from "zod";

export type SkillRiskLevel = "low" | "medium" | "high";

export type SkillInputField = {
  name: string;
  label: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  required: boolean;
  description: string;
};

export type SkillExecutionContext = {
  skillId: string;
  requestId: string;
  startedAt: string;
};

export type SkillDefinition<TInput = unknown, TOutput = unknown> = {
  id: string;
  name: string;
  description: string;
  category: string;
  emoji: string;
  featured: boolean;
  enabled: boolean;
  owner: string;
  riskLevel: SkillRiskLevel;
  invokeType: string;
  calls: string;
  tags: string[];
  useCases: string[];
  inputFields: SkillInputField[];
  outputDescription: string;
  callGuide: string;
  inputSchema: z.ZodType<TInput>;
  execute: (input: TInput, context: SkillExecutionContext) => TOutput | Promise<TOutput>;
};

export type AnySkillDefinition = SkillDefinition<any, any>;

export type SkillRunSuccess<TOutput = unknown> = {
  ok: true;
  skillId: string;
  skillName: string;
  output: TOutput;
  durationMs: number;
  startedAt: string;
  finishedAt: string;
};

export type SkillRunFailure = {
  ok: false;
  skillId: string;
  skillName?: string;
  error: string;
  issues?: string[];
  durationMs: number;
  startedAt: string;
  finishedAt: string;
};

export type SkillRunResult<TOutput = unknown> =
  | SkillRunSuccess<TOutput>
  | SkillRunFailure;
