import { z } from "zod";

import { getAssistantSettings, updateAssistantSettings } from "@/features/assistant/settings";
import { apiError, apiOk } from "@/lib/server/api-response";

export const runtime = "nodejs";

const settingsSchema = z.object({
  unmatchedGuide: z.string().trim().min(1, "请填写无匹配引导文案").max(500, "引导文案不能超过 500 个字符"),
});

export function GET() {
  return apiOk(getAssistantSettings());
}

export async function PATCH(request: Request) {
  const parsed = settingsSchema.safeParse(await request.json());
  if (!parsed.success) return apiError("AI 助手设置校验失败", 422, parsed.error.flatten());
  return apiOk(updateAssistantSettings(parsed.data.unmatchedGuide));
}
