import { NextRequest, NextResponse } from "next/server";

import {
  createKnowledge,
  listKnowledgeItems,
} from "@/knowhub/features/knowledge/service";
import type { CreateKnowledgeInput } from "@/knowhub/features/knowledge/types";

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

export async function GET() {
  try {
    const items = await listKnowledgeItems();

    return NextResponse.json({
      ok: true,
      items,
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as CreateKnowledgeInput;
    const item = await createKnowledge(payload);

    return NextResponse.json({
      ok: true,
      item,
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
