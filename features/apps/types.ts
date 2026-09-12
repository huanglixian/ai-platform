export type PlatformSource = 'appfactory' | 'external' | 'dify' | 'n8n';
export type AppType = 'business' | 'general';
export type ExternalLaunchStatus = 'starting' | 'running' | null;

export interface PublishedApp {
  id: string;
  name: string;
  description: string;
  source: PlatformSource;
  appType: AppType;
  url: string;
  launchCommand: string | null;
  launchStatus: ExternalLaunchStatus;
  isRemovable: boolean;
  createdAt: string;
  updatedAt: string;
}
