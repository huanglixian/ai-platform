import { NextResponse } from "next/server";

import { syncDocSpace } from "@/knowhub/features/docspaces/service";

export const dynamic = "force-dynamic";

type DocSpaceSyncRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  _request: Request,
  context: DocSpaceSyncRouteContext,
) {
  const { id } = await context.params;

  try {
    const item = await syncDocSpace(id);

    if (!item) {
      return NextResponse.json(
        {
          ok: false,
          error: "未找到对应文档空间",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      item,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "同步失败",
      },
      { status: 400 },
    );
  }
}
