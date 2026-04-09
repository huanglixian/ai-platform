import { NextResponse } from "next/server";

import { runKnowledge } from "@/knowhub/features/knowledge/service";

export const dynamic = "force-dynamic";

type KnowledgeRunRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  _request: Request,
  context: KnowledgeRunRouteContext,
) {
  try {
    const { id } = await context.params;
    const result = await runKnowledge(id);

    if (!result) {
      return NextResponse.json(
        {
          ok: false,
          error: "未找到对应知识库",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "建库失败",
      },
      { status: 400 },
    );
  }
}
