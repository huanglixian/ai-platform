export type PlatformSource = 'appfactory' | 'external' | 'dify' | 'n8n';
export type AppType = 'business' | 'general';

export interface PublishedApp {
  id: string;
  name: string;
  description: string;
  source: PlatformSource;
  appType: AppType;
  url: string;
  launchCommand: string | null;
  launchPid: number | null;
  launchStartedAt: string | null;
  isManagedRunning: boolean;
  createdAt: string;
  updatedAt: string;
}
