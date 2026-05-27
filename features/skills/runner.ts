import { getSkillById } from "@/features/skills/registry";
import type {
  SkillExecutionContext,
  SkillRunResult,
} from "@/features/skills/skill-types";

function createRequestId() {
  return `skill-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getDurationMs(startedAtMs: number) {
  return Math.max(0, Date.now() - startedAtMs);
}

export async function runSkill(skillId: string, input: unknown): Promise<SkillRunResult> {
  const startedAtMs = Date.now();
  const startedAt = new Date(startedAtMs).toISOString();
  const skill = getSkillById(skillId);

  if (!skill) {
    return {
      ok: false,
      skillId,
      error: "未找到对应技能",
      durationMs: getDurationMs(startedAtMs),
      startedAt,
      finishedAt: new Date().toISOString(),
    };
  }

  if (!skill.enabled) {
    return {
      ok: false,
      skillId,
      skillName: skill.name,
      error: "该技能当前未启用",
      durationMs: getDurationMs(startedAtMs),
      startedAt,
      finishedAt: new Date().toISOString(),
    };
  }

  const parsedInput = skill.inputSchema.safeParse(input ?? {});

  if (!parsedInput.success) {
    return {
      ok: false,
      skillId,
      skillName: skill.name,
      error: "技能参数不符合要求",
      issues: parsedInput.error.issues.map((issue) => {
        const path = issue.path.length ? issue.path.join(".") : "input";

        return `${path}: ${issue.message}`;
      }),
      durationMs: getDurationMs(startedAtMs),
      startedAt,
      finishedAt: new Date().toISOString(),
    };
  }

  const context: SkillExecutionContext = {
    skillId,
    requestId: createRequestId(),
    startedAt,
  };

  try {
    const output = await skill.execute(parsedInput.data, context);

    if (output === null || typeof output === "undefined") {
      return {
        ok: false,
        skillId,
        skillName: skill.name,
        error: "技能未返回结果",
        durationMs: getDurationMs(startedAtMs),
        startedAt,
        finishedAt: new Date().toISOString(),
      };
    }

    return {
      ok: true,
      skillId,
      skillName: skill.name,
      output,
      durationMs: getDurationMs(startedAtMs),
      startedAt,
      finishedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      ok: false,
      skillId,
      skillName: skill.name,
      error: error instanceof Error ? error.message : "技能执行失败",
      durationMs: getDurationMs(startedAtMs),
      startedAt,
      finishedAt: new Date().toISOString(),
    };
  }
}
