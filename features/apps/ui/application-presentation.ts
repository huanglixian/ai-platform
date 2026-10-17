import type { PlatformSource } from "@/features/apps/types";
import { Boxes, Globe2, Sparkles, Workflow } from "lucide-react";

export const sourceAccents = {
  appfactory: { icon: Boxes, iconClass: "border-[#ecd8d3] bg-[#faf0ec] text-[#a04c57]" },
  external: { icon: Globe2, iconClass: "border-[#ecd8d3] bg-[#faf0ec] text-[#a04c57]" },
  dify: { icon: Sparkles, iconClass: "border-[#ecd8d3] bg-[#faf0ec] text-[#a04c57]" },
  n8n: { icon: Workflow, iconClass: "border-[#ecd8d3] bg-[#faf0ec] text-[#a04c57]" },
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
