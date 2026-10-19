import type { PublishedApp } from "./types";

export function canOpenApplication(app: Pick<PublishedApp, "source" | "launchMode" | "launchStatus">) {
  return app.source !== "external" || app.launchMode === "link" || app.launchStatus === "running";
}
