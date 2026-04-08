import { Buffer } from "buffer";
import { NextResponse } from "next/server";

import { uploadDocSpaceFiles } from "@/knowhub/features/docspace/service";

export const dynamic = "force-dynamic";

type DocSpaceUploadRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  request: Request,
  context: DocSpaceUploadRouteContext,
) {
  try {
    const { id } = await context.params;
    const formData = await request.formData();
    const entries = formData.getAll("files");

    const files = await Promise.all(
      entries
        .filter((entry): entry is File => entry instanceof File)
        .map(async (file) => ({
          name: file.name,
          content: Buffer.from(await file.arrayBuffer()),
        })),
    );

    const item = await uploadDocSpaceFiles(id, files);

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
        error: error instanceof Error ? error.message : "上传失败",
      },
      { status: 400 },
    );
  }
}
