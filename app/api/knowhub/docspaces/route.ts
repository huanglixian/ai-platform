import { NextRequest, NextResponse } from "next/server";

import {
  createDocSpace,
  listDocSpaces,
} from "@/knowhub/features/docspaces/service";
import type { CreateDocSpaceInput } from "@/knowhub/features/docspaces/types";

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
  const items = await listDocSpaces();

  return NextResponse.json({
    ok: true,
    items,
  });
}

export async function POST(request: NextRequest) {
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
