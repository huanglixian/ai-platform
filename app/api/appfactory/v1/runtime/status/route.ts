import fs from "node:fs";
import path from "node:path";

import nextEnv from "@next/env";
import { getAppFactoryModelSettings } from "@/app_factory/server/database";
import { listAppTemplates } from "@/app_factory/template-catalog";
import {
  getModelConfigurationError,
  getModelProfile,
  presentModelProfiles,
} from "@/app_factory/server/model-profiles";
import { apiOk } from "@/lib/server/api-response";

export const runtime = "nodejs";

export async function GET() {
  nextEnv.loadEnvConfig(process.cwd());
  const modelSettings = getAppFactoryModelSettings();
  const modelProfile = getModelProfile(modelSettings.defaultModelProfileId);
  return apiOk({
    ai: {
      configured: !getModelConfigurationError(modelProfile),
      provider: modelProfile.provider,
      model: modelProfile.label,
      thinkingLevel: modelSettings.thinkingLevels[modelProfile.id],
    },
    modelSettings: {
      defaultModelProfileId: modelSettings.defaultModelProfileId,
      thinkingLevels: modelSettings.thinkingLevels,
      profiles: presentModelProfiles(),
    },
    harness: {
      ready: fs.existsSync(
        path.join(process.cwd(), "node_modules", ".bin", "pi"),
      ),
      name: "Pi Harness",
    },
    templates: listAppTemplates().map((template) => ({
      id: template.id,
      name: template.name,
      ready: fs.existsSync(path.join(template.rootPath, "SKILL.md")) &&
        fs.existsSync(path.join(template.rootPath, "scaffold")),
    })),
  });
}
