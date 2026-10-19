import type { PlatformSource } from "@/features/apps/types";
import { Boxes, Globe2, Sparkles, Workflow } from "lucide-react";

export const sourceAccents = {
  appfactory: { icon: Boxes, iconClass: "border-[var(--skin-border)] bg-[var(--skin-surface-accent)] text-[var(--skin-primary)]" },
  external: { icon: Globe2, iconClass: "border-[var(--skin-border)] bg-[var(--skin-surface-accent)] text-[var(--skin-primary)]" },
  dify: { icon: Sparkles, iconClass: "border-[var(--skin-border)] bg-[var(--skin-surface-accent)] text-[var(--skin-primary)]" },
  n8n: { icon: Workflow, iconClass: "border-[var(--skin-border)] bg-[var(--skin-surface-accent)] text-[var(--skin-primary)]" },
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

export const deploymentStatusLabels = {
  queued: "等待部署", running: "部署中", needs_config: "待补充配置", ready: "已就绪",
  failed: "部署失败", cancelled: "已取消", interrupted: "部署中断",
} as const;
