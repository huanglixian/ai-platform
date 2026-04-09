import { NextRequest, NextResponse } from "next/server";

import { testStrategyTemplate } from "@/knowhub/features/strategies/service";
import type { StrategySettingValue } from "@/knowhub/features/strategies/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const templateId = String(formData.get("templateId") ?? "").trim();
    const presetId = String(formData.get("presetId") ?? "").trim();
    const valuesText = String(formData.get("values") ?? "{}");
    const file = formData.get("file");

    if (!templateId) {
      throw new Error("缺少策略模板");
    }

    if (!(file instanceof File)) {
      throw new Error("请选择测试文件");
    }

    const content = await file.text();
    const result = await testStrategyTemplate({
      templateId,
      presetId: presetId || undefined,
      filePath: file.name,
      content,
      values: JSON.parse(valuesText) as Record<string, StrategySettingValue>,
    });

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "测试失败",
      },
      { status: 400 },
    );
  }
}
