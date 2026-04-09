import { NextRequest, NextResponse } from "next/server";

import {
  getEmbeddingConfig,
  saveEmbeddingConfig,
} from "@/knowhub/features/settings/embedding/embedding-config-service";

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
    const item = await getEmbeddingConfig();

    return NextResponse.json({
      ok: true,
      item,
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const payload = (await request.json()) as {
      baseUrl: string;
      apiKey: string;
      model: string;
    };
    const item = await saveEmbeddingConfig(payload);

    return NextResponse.json({
      ok: true,
      item,
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
