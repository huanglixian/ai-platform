import nextEnv from "@next/env";

import {
  getAppFactoryModelSettings,
  updateAppFactoryModelSettings,
} from "@/app_factory/server/database";
import {
  isModelProfileId,
  isThinkingLevelsByProfile,
  presentModelProfiles,
} from "@/app_factory/server/model-profiles";
import { apiError, apiOk } from "@/lib/server/api-response";

export const runtime = "nodejs";

function presentSettings() {
  const settings = getAppFactoryModelSettings();
  return {
    defaultModelProfileId: settings.defaultModelProfileId,
    thinkingLevels: settings.thinkingLevels,
    profiles: presentModelProfiles(),
  };
}

export async function GET() {
  nextEnv.loadEnvConfig(process.cwd());
  return apiOk(presentSettings());
}

export async function PUT(request: Request) {
  nextEnv.loadEnvConfig(process.cwd());
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return apiError("设置内容必须是 JSON", 400);
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return apiError("设置内容无效", 422);
  }

  const { defaultModelProfileId, thinkingLevels } = payload as Record<string, unknown>;
  if (!isModelProfileId(defaultModelProfileId)) return apiError("模型选择无效", 422);
  if (!isThinkingLevelsByProfile(thinkingLevels)) return apiError("思考程度无效，请按各模型档案的可选档位设置", 422);

  updateAppFactoryModelSettings({ defaultModelProfileId, thinkingLevels });
  return apiOk(presentSettings());
}
