import type { PlatformSource } from "@/features/apps/types";
import { Boxes, Globe2, Sparkles, Workflow } from "lucide-react";

export const sourceAccents = {
  appfactory: { icon: Boxes, iconClass: "border-[#d4dcf4] bg-[#edf0fc] text-[#5264a4]" },
  external: { icon: Globe2, iconClass: "border-[#c8e3e5] bg-[#eaf5f5] text-[#2f7a83]" },
  dify: { icon: Sparkles, iconClass: "border-[#dfd7ef] bg-[#f2eef9] text-[#7b60a5]" },
  n8n: { icon: Workflow, iconClass: "border-[#efd9d3] bg-[#fcf0ec] text-[#b56e5e]" },
};

export const sourceLabels: Record<PlatformSource, string> = {
  appfactory: "AppFactory",
  external: "外部应用",
  dify: "Dify",
  n8n: "n8n",
};

export const typeLabels = {
  business: "业务类应用",
  general: "通用类应用",
} as const;
