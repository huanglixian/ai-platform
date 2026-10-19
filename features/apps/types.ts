export type PlatformSource = 'appfactory' | 'external' | 'dify' | 'n8n';
export type AppType = 'business' | 'general';
export type ExternalLaunchStatus = 'starting' | 'running' | null;
export type DeploymentStatus = 'queued' | 'running' | 'needs_config' | 'ready' | 'failed' | 'cancelled' | 'interrupted';
export type DeploymentSummary = {
  status: DeploymentStatus;
  message: string;
  error: string | null;
  missingConfig: string[];
};

export interface PublishedApp {
  id: string;
  name: string;
  description: string;
  source: PlatformSource;
  appType: AppType;
  url: string;
  launchCommand: string | null;
  launchStatus: ExternalLaunchStatus;
  launchMode: 'link' | 'managed';
  deployment?: DeploymentSummary;
  createdAt: string;
  updatedAt: string;
  access?: ResourcePolicy;
  canManage?: boolean;
  canOperate?: boolean;
  canUse?: boolean;
}

export type ExternalStopResult = {
  stoppedIds: string[];
  failures: { id: string; name: string; message: string }[];
};

export type ExternalStopResponse = ExternalStopResult & {
  applications: PublishedApp[];
};
import type { ResourcePolicy } from "@/features/access/types";
