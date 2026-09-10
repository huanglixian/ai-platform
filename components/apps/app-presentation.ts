import type { PlatformSource } from "@/features/apps/types";

export const APP_TABS = ["全部", "AppFactory", "外部应用", "Dify", "n8n"] as const;
export const APP_GROUP_TABS = APP_TABS.filter((tab) => tab !== "全部");

export const sourceLabels: Record<PlatformSource, (typeof APP_GROUP_TABS)[number]> = {
  appfactory: "AppFactory",
  external: "外部应用",
  dify: "Dify",
  n8n: "n8n",
};

export const sourceStyles: Record<PlatformSource, { badge: string; label: string }> = {
  appfactory: { badge: "border-indigo-200 bg-indigo-50 text-indigo-700", label: "AppFactory" },
  external: { badge: "border-violet-200 bg-violet-50 text-violet-700", label: "外部应用" },
  dify: { badge: "border-blue-200 bg-blue-50 text-blue-700", label: "Dify" },
  n8n: { badge: "border-orange-200 bg-orange-50 text-orange-700", label: "n8n" },
};

export const typeLabels = {
  business: "业务类应用",
  general: "通用类应用",
} as const;
