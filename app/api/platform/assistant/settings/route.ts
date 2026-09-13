import { assistantSettingsSchema, getAssistantSettings, updateAssistantSettings } from "@/features/assistant/settings";
import { apiError, apiOk } from "@/lib/server/api-response";

export const runtime = "nodejs";

export function GET() {
  return apiOk(getAssistantSettings());
}

export async function PATCH(request: Request) {
  const parsed = assistantSettingsSchema.safeParse(await request.json());
  if (!parsed.success) return apiError("AI 助手设置校验失败", 422, parsed.error.flatten());
  return apiOk(updateAssistantSettings(parsed.data.unmatchedGuide));
}
