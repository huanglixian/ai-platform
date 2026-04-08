import { NextResponse } from "next/server";

import { listDocSpaceFiles } from "@/knowhub/features/docspace/service";

export const dynamic = "force-dynamic";

type DocSpaceFilesRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: Request,
  context: DocSpaceFilesRouteContext,
) {
  const { id } = await context.params;
  const items = await listDocSpaceFiles(id);

  if (!items) {
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
    items,
  });
}
