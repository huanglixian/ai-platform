import { withApiAuth } from "@/features/auth/api";
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

async function handleGET(
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

async function handleDELETE(
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

export const GET = withApiAuth(handleGET);
export const DELETE = withApiAuth(handleDELETE);
