export type BotStatus = "活跃" | "空闲" | "草稿";

export type BotChannel = {
  id: string;
  label: string;
};

export type BotMetric = {
  label: string;
  value: string;
};

export type BotRecord = {
  id: string;
  name: string;
  code: string;
  emoji: string;
  role: string;
  description: string;
  status: BotStatus;
  model: string;
  workspace: string;
  agentPath: string;
  sandboxEnabled: boolean;
  updatedAt: string;
  metrics: BotMetric[];
  channels: BotChannel[];
  tags: string[];
};
