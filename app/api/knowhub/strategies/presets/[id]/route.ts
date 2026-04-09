import { NextRequest, NextResponse } from "next/server";

import { updateStrategyPreset } from "@/knowhub/features/strategies/service";
import type { StrategySettingValue } from "@/knowhub/features/strategies/types";

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

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const payload = (await request.json()) as {
      name: string;
      values?: Record<string, StrategySettingValue>;
    };
    const item = await updateStrategyPreset({
      id,
      ...payload,
    });

    if (!item) {
      return createErrorResponse(new Error("未找到预设"), 404);
    }

    return NextResponse.json({
      ok: true,
      item,
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
