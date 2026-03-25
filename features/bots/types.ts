export type BotStatus = "活跃" | "空闲" | "草稿";

export type BotMetric = {
  label: string;
  value: string;
};

export type BotRecord = {
  id: string;
  name: string;
  code: string;
  emoji: string;
  description: string;
  status: BotStatus;
  sandboxEnabled: boolean;
  metrics: BotMetric[];
  tags: string[];
};
