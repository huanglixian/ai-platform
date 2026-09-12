import fs from "node:fs";
import path from "node:path";

import { loadEnvConfig } from "@next/env";
import { getAppFactoryModelSettings } from "@/app_factory/server/database";
import { listAppTemplates } from "@/app_factory/template-catalog";
import {
  getModelApiKey,
  getModelProfile,
  presentModelProfiles,
} from "@/app_factory/server/model-profiles";
import { apiOk } from "@/lib/server/api-response";

export const runtime = "nodejs";

export async function GET() {
  loadEnvConfig(process.cwd());
  const modelSettings = getAppFactoryModelSettings();
  const modelProfile = getModelProfile(modelSettings.defaultModelProfileId);
  return apiOk({
    ai: {
      configured: Boolean(getModelApiKey(modelProfile)),
      provider: modelProfile.provider,
      model: modelProfile.label,
      thinkingLevel: modelSettings.thinkingLevel,
    },
    modelSettings: {
      defaultModelProfileId: modelSettings.defaultModelProfileId,
      thinkingLevel: modelSettings.thinkingLevel,
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
