import fs from "node:fs";
import path from "node:path";

import { loadEnvConfig } from "@next/env";
import { getAppFactoryModelSettings } from "@/app_factory/server/database";
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
  const skillPath = path.join(
    process.cwd(),
    "app_factory",
    "skills",
    "nextjs-build",
    "SKILL.md",
  );
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
    skill: { ready: fs.existsSync(skillPath), name: "nextjs-build" },
  });
}
