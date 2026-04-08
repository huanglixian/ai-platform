import { NextResponse } from "next/server";

import {
  deleteDocSpace,
  getDocSpaceById,
} from "@/knowhub/features/docspace/service";

export const dynamic = "force-dynamic";

type DocSpaceRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: Request,
  context: DocSpaceRouteContext,
) {
  const { id } = await context.params;
  const item = await getDocSpaceById(id);

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
}

export async function DELETE(
  _request: Request,
  context: DocSpaceRouteContext,
) {
  const { id } = await context.params;
  const item = await deleteDocSpace(id);

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
}
