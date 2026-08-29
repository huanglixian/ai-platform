import fs from "node:fs";
import path from "node:path";

import { loadEnvConfig } from "@next/env";
import { apiOk } from "@/lib/server/api-response";

export const runtime = "nodejs";

export async function GET() {
  loadEnvConfig(process.cwd());
  const provider =
    process.env.APPFACTORY_PI_PROVIDER?.trim() ||
    (process.env.DEEPSEEK_API_KEY ? "deepseek" : "");
  const model =
    process.env.APPFACTORY_PI_MODEL?.trim() ||
    (provider === "deepseek"
      ? process.env.DEEPSEEK_MODEL?.trim() || "deepseek-chat"
      : "");
  const skillPath = path.join(
    process.cwd(),
    "app_factory",
    "skills",
    "nextjs-build",
    "SKILL.md",
  );
  return apiOk({
    ai: {
      configured: Boolean(
        provider &&
        (process.env.APPFACTORY_PI_API_KEY?.trim() ||
          process.env.DEEPSEEK_API_KEY?.trim()),
      ),
      provider: provider || null,
      model: model || null,
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
