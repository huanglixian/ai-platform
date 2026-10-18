import { withApiAuth } from "@/features/auth/api";
import { NextRequest, NextResponse } from "next/server";

import {
  createStrategyPreset,
  listStrategyPresetItems,
} from "@/knowhub/features/strategies/service";
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

async function handleGET(request: NextRequest) {
  try {
    const templateId = request.nextUrl.searchParams.get("templateId") ?? undefined;
    const items = await listStrategyPresetItems(templateId);

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
    const payload = (await request.json()) as {
      templateId: string;
      name: string;
      values?: Record<string, StrategySettingValue>;
    };
    const item = await createStrategyPreset(payload);

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
