export type PlatformSource = 'dify' | 'n8n' | 'native';
export type AppType = 'business' | 'general';

export interface PublishedApp {
  id: string;
  name: string;
  description: string;
  source: PlatformSource; // 来源平台
  appType: AppType;       // 应用功能类型
  url: string;             // 第三方应用的发布访问链接
  createdAt: string;
  updatedAt: string;
}
