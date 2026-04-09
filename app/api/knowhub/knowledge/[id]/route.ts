import { NextResponse } from "next/server";

import { getKnowledgeById, listKnowledgeRuns } from "@/knowhub/features/knowledge/service";

export const dynamic = "force-dynamic";

type KnowledgeRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: Request,
  context: KnowledgeRouteContext,
) {
  const { id } = await context.params;
  const item = await getKnowledgeById(id);

  if (!item) {
    return NextResponse.json(
      {
        ok: false,
        error: "未找到对应知识库",
      },
      { status: 404 },
    );
  }

  const runs = await listKnowledgeRuns(id);

  return NextResponse.json({
    ok: true,
    item,
    runs,
  });
}
