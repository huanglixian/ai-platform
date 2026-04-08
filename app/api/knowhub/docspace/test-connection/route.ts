import { NextRequest, NextResponse } from "next/server";

import { testDocSpaceConnection } from "@/knowhub/features/docspace/service";
import type { TestDocSpaceConnectionInput } from "@/knowhub/features/docspace/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as TestDocSpaceConnectionInput;
    const result = await testDocSpaceConnection(payload);

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "测试连接失败",
      },
      { status: 400 },
    );
  }
}
