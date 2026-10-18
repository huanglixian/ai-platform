import { withApiAuth } from "@/features/auth/api";
import { NextRequest, NextResponse } from "next/server";

import {
  createDocSpace,
  listDocspaceItems,
} from "@/knowhub/features/docspace/service";
import type { CreateDocSpaceInput } from "@/knowhub/features/docspace/types";

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
  const items = await listDocspaceItems();

  return NextResponse.json({
    ok: true,
    items,
  });
}

async function handlePOST(request: NextRequest) {
  try {
    const payload = (await request.json()) as CreateDocSpaceInput;
    const item = await createDocSpace(payload);

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
