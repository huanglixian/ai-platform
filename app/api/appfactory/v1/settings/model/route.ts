import { loadEnvConfig } from "@next/env";

import {
  getAppFactoryModelSettings,
  updateAppFactoryModelSettings,
} from "@/app_factory/server/database";
import {
  isModelProfileId,
  isThinkingLevel,
  presentModelProfiles,
} from "@/app_factory/server/model-profiles";
import { apiError, apiOk } from "@/lib/server/api-response";

export const runtime = "nodejs";

function presentSettings() {
  const settings = getAppFactoryModelSettings();
  return {
    defaultModelProfileId: settings.defaultModelProfileId,
    thinkingLevel: settings.thinkingLevel,
    profiles: presentModelProfiles(),
  };
}

export async function GET() {
  loadEnvConfig(process.cwd());
  return apiOk(presentSettings());
}

export async function PUT(request: Request) {
  loadEnvConfig(process.cwd());
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return apiError("设置内容必须是 JSON", 400);
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return apiError("设置内容无效", 422);
  }

  const { defaultModelProfileId, thinkingLevel } = payload as Record<string, unknown>;
  if (!isModelProfileId(defaultModelProfileId)) return apiError("模型选择无效", 422);
  if (!isThinkingLevel(thinkingLevel)) return apiError("思考程度无效", 422);

  updateAppFactoryModelSettings({ defaultModelProfileId, thinkingLevel });
  return apiOk(presentSettings());
}
