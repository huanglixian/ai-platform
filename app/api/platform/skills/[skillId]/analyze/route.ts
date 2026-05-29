import { NextResponse } from "next/server";
import path from "node:path";
import { generateSkillFlowMermaid } from "@/features/services/tools/skills-flow";

type RouteContext = {
  params: Promise<{
    skillId: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { skillId } = await context.params;

  try {
    const skillsRoot = path.join(process.cwd(), "storage", "platform", "skills");
    const targetDir = path.resolve(skillsRoot, skillId);

    // 安全检查，防止目录穿越
    if (!targetDir.startsWith(skillsRoot)) {
      return NextResponse.json({ ok: false, error: "非法操作路径" }, { status: 400 });
    }

    // 重用 skills-flow 导出的核心生成逻辑，并等待其执行完毕
    const flowMermaid = await generateSkillFlowMermaid(skillId);

    return NextResponse.json({
      ok: true,
      flowMermaid,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "AI 分析失败",
      },
      { status: 500 }
    );
  }
}

