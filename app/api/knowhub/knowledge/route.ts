import { withApiAuth } from "@/features/auth/api";
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

async function handleGET() {
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

async function handlePOST(request: NextRequest) {
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

export const GET = withApiAuth(handleGET);
export const POST = withApiAuth(handlePOST);
