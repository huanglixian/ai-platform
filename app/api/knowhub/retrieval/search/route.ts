import { NextRequest, NextResponse } from "next/server";

import { searchKnowledgeSlices } from "@/knowhub/features/retrieval/service";

export const dynamic = "force-dynamic";

function createErrorResponse(error: unknown, status = 400) {
  return NextResponse.json(
    {
      ok: false,
      error: error instanceof Error ? error.message : "请求失败",
    },
    { status },
  );
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as {
      knowledgeId: string;
      query: string;
      limit?: number;
    };
    const result = await searchKnowledgeSlices(payload);

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
