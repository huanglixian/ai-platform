import "server-only";

import fs from "node:fs";
import path from "node:path";

import { z } from "zod";

import { dataPaths } from "@/lib/data-paths";

export type AssistantSettings = {
  unmatchedGuide: string;
};

export const assistantSettingsSchema = z.object({
  unmatchedGuide: z.string().trim().min(1, "请填写无匹配引导文案").max(500, "引导文案不能超过 500 个字符"),
});

export function getAssistantSettings(): AssistantSettings {
  const content = fs.readFileSync(dataPaths.assistantSettings, "utf8");
  return assistantSettingsSchema.parse(JSON.parse(content));
}

export function updateAssistantSettings(unmatchedGuide: string): AssistantSettings {
  const settings = assistantSettingsSchema.parse({ unmatchedGuide });
  fs.mkdirSync(path.dirname(dataPaths.assistantSettings), { recursive: true });
  const temporaryPath = `${dataPaths.assistantSettings}.${process.pid}.tmp`;
  fs.writeFileSync(temporaryPath, `${JSON.stringify(settings, null, 2)}\n`, "utf8");
  fs.renameSync(temporaryPath, dataPaths.assistantSettings);
  return settings;
}
