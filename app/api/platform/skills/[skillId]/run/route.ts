import { NextResponse } from "next/server";

import { buildSkillRunContext } from "@/features/skills/runner";

export const dynamic = "force-dynamic";

type SkillRunRouteContext = {
  params: Promise<{
    skillId: string;
  }>;
};

export async function POST(_request: Request, context: SkillRunRouteContext) {
  const { skillId } = await context.params;

  try {
    const result = buildSkillRunContext(skillId);

    return NextResponse.json(result, {
      status: result.ok ? 200 : result.error === "未找到对应技能" ? 404 : 400,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        skillId,
        error: error instanceof Error ? error.message : "技能执行请求失败",
      },
      { status: 400 },
    );
  }
}
